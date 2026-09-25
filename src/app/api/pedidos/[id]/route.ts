import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/auth/session';
import { ApiError, withApiErrors } from '@/lib/api/http';
import { eliminarPedido, editarFechaPedido } from '@/lib/firestore/adminOps/pedidos';
import { authorizeOrPin } from '@/lib/firestore/adminOps/adminPin';

/** Eliminar la mesa/pedido completo — admin libre, mesero/cajero con PIN de admin. */
export const DELETE = withApiErrors(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireUser(req);
  if (!['mesero', 'cajero', 'admin'].includes(user.rol)) throw new ApiError(403, 'No autorizado');
  const { pin } = (await req.json().catch(() => ({}))) as { pin?: string };
  await authorizeOrPin(user, pin);
  await eliminarPedido(params.id);
  return new NextResponse(null, { status: 204 });
});

/** Corregir la fecha de un pedido ya registrado — solo admin, desde Ventas. */
export const PATCH = withApiErrors(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await requireRole(req, ['admin']);
  const { fecha } = (await req.json()) as { fecha?: string };
  if (!fecha) throw new ApiError(400, 'Falta la fecha');
  await editarFechaPedido(params.id, fecha);
  return new NextResponse(null, { status: 204 });
});
