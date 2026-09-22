import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { withApiErrors } from '@/lib/api/http';
import { buildBackupWorkbook } from '@/lib/excel/export';
import { todayStr } from '@/lib/utils/date';

export const GET = withApiErrors(async (req: NextRequest) => {
  await requireRole(req, ['admin']);
  const buffer = await buildBackupWorkbook();
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="luz-de-luna-respaldo-${todayStr()}.xlsx"`,
    },
  });
});
