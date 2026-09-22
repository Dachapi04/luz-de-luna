import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { withApiErrors } from '@/lib/api/http';
import { editarProducto, eliminarProducto, type ProductoInput } from '@/lib/firestore/adminOps/productos';

export const PATCH = withApiErrors(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await requireRole(req, ['admin']);
  const body = (await req.json()) as ProductoInput;
  const producto = await editarProducto(params.id, body);
  return NextResponse.json(producto);
});

export const DELETE = withApiErrors(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await requireRole(req, ['admin']);
  await eliminarProducto(params.id);
  return new NextResponse(null, { status: 204 });
});
