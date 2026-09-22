import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { withApiErrors } from '@/lib/api/http';
import { eliminarCompra } from '@/lib/firestore/adminOps/compras';

export const DELETE = withApiErrors(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await requireRole(req, ['admin']);
  await eliminarCompra(params.id);
  return new NextResponse(null, { status: 204 });
});
