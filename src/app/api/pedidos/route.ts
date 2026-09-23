import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { ApiError, withApiErrors } from '@/lib/api/http';
import { enviarPedido, type CartLineInput } from '@/lib/firestore/adminOps/pedidos';

export const POST = withApiErrors(async (req: NextRequest) => {
  // mesero abre mesas normales; cajero puede cargar una venta directa en
  // caja (ver domain/permissions.ts) y cobrarla enseguida.
  const usuario = await requireRole(req, ['mesero', 'cajero', 'admin']);
  const { mesa, cart } = (await req.json()) as { mesa: string; cart: CartLineInput[] };
  if (!mesa?.trim()) throw new ApiError(400, 'Falta la mesa');
  const pedido = await enviarPedido(usuario, mesa.trim(), cart);
  return NextResponse.json(pedido, { status: 201 });
});
