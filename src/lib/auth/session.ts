import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { users, type UserRow } from '@/db/schema';
import type { User } from '@/lib/types';
import { verifyToken } from './token';

export function toPublicUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.createdAt.toISOString(),
    avatarOptions: row.avatarOptions ?? null,
  };
}

/** Full DB row (includes pointsBalance etc.) for the caller of `request`, or null. */
export async function getAuthenticatedUser(
  request: Request,
): Promise<UserRow | null> {
  const header = request.headers.get('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;

  const userId = await verifyToken(token);
  if (!userId) return null;

  const [row] = await getDb()
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row ?? null;
}

/** Public-shape user (no passwordHash/pointsBalance) for the caller of `request`. */
export async function getUserFromRequest(request: Request): Promise<User | null> {
  const row = await getAuthenticatedUser(request);
  return row ? toPublicUser(row) : null;
}
