import { NextResponse } from 'next/server';
import type { User } from '@/lib/types';
import { getUserFromRequest } from './session';

type RequireUserResult =
  | { user: User; error?: undefined }
  | { user?: undefined; error: NextResponse };

/**
 * Shared entry check for API routes: resolves the bearer token to a user or
 * returns a ready-to-return 401 response. Usage:
 *
 *   const auth = await requireUser(request);
 *   if (auth.error) return auth.error;
 *   const { user } = auth;
 */
export async function requireUser(request: Request): Promise<RequireUserResult> {
  const user = await getUserFromRequest(request);
  if (!user) {
    return {
      error: NextResponse.json({ error: 'Нэвтрээгүй байна.' }, { status: 401 }),
    };
  }
  return { user };
}
