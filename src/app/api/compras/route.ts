import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { withApiErrors } from '@/lib/api/http';
import { crearCompra, type CompraInput } from '@/lib/firestore/adminOps/compras';

export const POST = withApiErrors(async (req: NextRequest) => {
  await requireRole(req, ['admin']);
  const body = (await req.json()) as CompraInput;
  const result = await crearCompra(body);
  return NextResponse.json(result, { status: 201 });
});
