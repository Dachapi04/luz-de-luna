import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { withApiErrors } from '@/lib/api/http';
import { registrarPago, type RegistrarPagoInput } from '@/lib/firestore/adminOps/pedidos';

/** Registra un abono a la cuenta (puede ser el total de una vez, o el pedido dividido en varios abonos). */
export const POST = withApiErrors(async (req: NextRequest) => {
  const cajero = await requireRole(req, ['cajero', 'admin']);
  const { mesa, ...input } = (await req.json()) as { mesa: string } & RegistrarPagoInput;
  const pedido = await registrarPago(cajero, mesa, input);
  return NextResponse.json(pedido);
});
