import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { withApiErrors } from '@/lib/api/http';
import { crearProducto, type ProductoInput } from '@/lib/firestore/adminOps/productos';

export const POST = withApiErrors(async (req: NextRequest) => {
  await requireRole(req, ['admin']);
  const body = (await req.json()) as ProductoInput;
  const producto = await crearProducto(body);
  return NextResponse.json(producto, { status: 201 });
});
