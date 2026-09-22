import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { withApiErrors } from '@/lib/api/http';
import { ajustarStockRapido } from '@/lib/firestore/adminOps/productos';

export const PATCH = withApiErrors(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await requireRole(req, ['admin']);
  const { delta } = (await req.json()) as { delta: number };
  await ajustarStockRapido(params.id, Number(delta));
  return new NextResponse(null, { status: 204 });
});
