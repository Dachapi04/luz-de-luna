import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { withApiErrors } from '@/lib/api/http';
import { guardarCierre } from '@/lib/firestore/adminOps/cierres';

export const POST = withApiErrors(async (req: NextRequest) => {
  const admin = await requireRole(req, ['admin']);
  const { fecha } = (await req.json()) as { fecha: string };
  const cierre = await guardarCierre(admin, fecha);
  return NextResponse.json(cierre);
});
