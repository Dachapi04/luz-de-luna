import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { withApiErrors } from '@/lib/api/http';
import { crearUsuario, type UsuarioInput } from '@/lib/firestore/adminOps/usuarios';

export const POST = withApiErrors(async (req: NextRequest) => {
  await requireRole(req, ['admin']);
  const body = (await req.json()) as UsuarioInput;
  const usuario = await crearUsuario(body);
  return NextResponse.json(usuario, { status: 201 });
});
