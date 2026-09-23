import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { ApiError, withApiErrors } from '@/lib/api/http';
import { editarCantidadItem, marcarListo, quitarItemPedido } from '@/lib/firestore/adminOps/pedidos';
import { authorizeOrPin } from '@/lib/firestore/adminOps/adminPin';

interface Params {
  params: { id: string; itemId: string };
}

/**
 * PATCH hace dos cosas distintas según el body:
 *  - { listo }: cocina/bartender tachan un producto (o admin, por cualquiera).
 *  - { cantidad, pin? }: mesero/cajero (con PIN de admin) o admin cambian
 *    la cantidad de una línea ya enviada — eliminar la mesa/quitar un
 *    producto/editar cantidad son la misma clase de corrección "de piso".
 */
export const PATCH = withApiErrors(async (req: NextRequest, { params }: Params) => {
  const user = await requireUser(req);
  const body = (await req.json()) as { listo?: boolean; cantidad?: number; pin?: string };

  if (typeof body.listo === 'boolean') {
    if (!['cocina', 'bartender', 'admin'].includes(user.rol)) {
      throw new ApiError(403, 'No autorizado');
    }
    await marcarListo(params.id, params.itemId, body.listo, user.rol);
    return new NextResponse(null, { status: 204 });
  }

  if (typeof body.cantidad === 'number') {
    if (!['mesero', 'cajero', 'admin'].includes(user.rol)) throw new ApiError(403, 'No autorizado');
    await authorizeOrPin(user, body.pin);
    await editarCantidadItem(params.id, params.itemId, body.cantidad);
    return new NextResponse(null, { status: 204 });
  }

  throw new ApiError(400, 'Falta "listo" o "cantidad" en el cuerpo de la petición');
});

/** Quitar una línea de un pedido ya enviado — admin libre, mesero/cajero con PIN de admin. */
export const DELETE = withApiErrors(async (req: NextRequest, { params }: Params) => {
  const user = await requireUser(req);
  if (!['mesero', 'cajero', 'admin'].includes(user.rol)) throw new ApiError(403, 'No autorizado');
  const { pin } = (await req.json().catch(() => ({}))) as { pin?: string };
  await authorizeOrPin(user, pin);
  await quitarItemPedido(params.id, params.itemId);
  return new NextResponse(null, { status: 204 });
});
