import { NextRequest, NextResponse } from 'next/server';
import { requireRole, requireUser } from '@/lib/auth/session';
import { withApiErrors } from '@/lib/api/http';
import { marcarListo, quitarItemPedido } from '@/lib/firestore/adminOps/pedidos';

interface Params {
  params: { id: string; itemId: string };
}

/** Cocina/bartender tachan un producto; admin puede hacerlo por cualquiera. */
export const PATCH = withApiErrors(async (req: NextRequest, { params }: Params) => {
  const user = await requireUser(req);
  if (!['cocina', 'bartender', 'admin'].includes(user.rol)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  const { listo } = (await req.json()) as { listo: boolean };
  await marcarListo(params.id, params.itemId, !!listo, user.rol);
  return new NextResponse(null, { status: 204 });
});

/** Quitar una línea de un pedido ya enviado (panel de Ventas) — solo admin. */
export const DELETE = withApiErrors(async (req: NextRequest, { params }: Params) => {
  await requireRole(req, ['admin']);
  await quitarItemPedido(params.id, params.itemId);
  return new NextResponse(null, { status: 204 });
});
