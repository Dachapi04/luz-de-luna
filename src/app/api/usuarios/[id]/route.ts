import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { withApiErrors } from '@/lib/api/http';
import { editarUsuario, eliminarUsuario, type UsuarioInput } from '@/lib/firestore/adminOps/usuarios';

export const PATCH = withApiErrors(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await requireRole(req, ['admin']);
  const body = (await req.json()) as UsuarioInput;
  const usuario = await editarUsuario(params.id, body);
  return NextResponse.json(usuario);
});

export const DELETE = withApiErrors(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await requireRole(req, ['admin']);
  await eliminarUsuario(params.id);
  return new NextResponse(null, { status: 204 });
});
