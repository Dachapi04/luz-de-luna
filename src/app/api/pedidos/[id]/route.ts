import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { withApiErrors } from '@/lib/api/http';
import { eliminarPedido } from '@/lib/firestore/adminOps/pedidos';

export const DELETE = withApiErrors(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await requireRole(req, ['admin']);
  await eliminarPedido(params.id);
  return new NextResponse(null, { status: 204 });
});
