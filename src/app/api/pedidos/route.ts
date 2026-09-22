import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { ApiError, withApiErrors } from '@/lib/api/http';
import { enviarPedido, type CartLineInput } from '@/lib/firestore/adminOps/pedidos';

export const POST = withApiErrors(async (req: NextRequest) => {
  const mesero = await requireRole(req, ['mesero', 'admin']);
  const { mesa, cart } = (await req.json()) as { mesa: string; cart: CartLineInput[] };
  if (!mesa?.trim()) throw new ApiError(400, 'Falta la mesa');
  const pedido = await enviarPedido(mesero, mesa.trim(), cart);
  return NextResponse.json(pedido, { status: 201 });
});
