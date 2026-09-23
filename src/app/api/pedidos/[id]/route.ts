import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { ApiError, withApiErrors } from '@/lib/api/http';
import { eliminarPedido } from '@/lib/firestore/adminOps/pedidos';
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
