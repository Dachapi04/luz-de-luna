import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { withApiErrors } from '@/lib/api/http';
import { cobrarPedido } from '@/lib/firestore/adminOps/pedidos';
import type { MetodoPago } from '@/domain/types';

export const POST = withApiErrors(async (req: NextRequest) => {
  const cajero = await requireRole(req, ['cajero', 'admin']);
  const { mesa, metodoPago, recibido } = (await req.json()) as {
    mesa: string;
    metodoPago: MetodoPago;
    recibido: number;
  };
  const pedido = await cobrarPedido(cajero, mesa, metodoPago, Number(recibido) || 0);
  return NextResponse.json(pedido);
});
