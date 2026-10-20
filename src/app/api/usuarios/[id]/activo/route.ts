import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { withApiErrors } from '@/lib/api/http';
import { setUsuarioActivo } from '@/lib/firestore/adminOps/usuarios';

export const POST = withApiErrors(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const actor = await requireRole(req, ['admin']);
  const { activo } = (await req.json()) as { activo: boolean };
  await setUsuarioActivo(params.id, activo === true, actor.id);
  return new NextResponse(null, { status: 204 });
});
