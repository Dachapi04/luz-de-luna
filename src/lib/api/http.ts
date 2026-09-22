import 'server-only';
import { NextResponse } from 'next/server';
import { AuthError } from '@/lib/auth/session';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Wraps a route handler so thrown AuthError/ApiError become clean JSON responses. */
export function withApiErrors<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof AuthError || err instanceof ApiError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      console.error(err);
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
  };
}
