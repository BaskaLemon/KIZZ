import { NextResponse } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { notifications } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';

/** Marks all of the caller's notifications as read. */
export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;

  await getDb()
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(eq(notifications.userId, auth.user.id), isNull(notifications.readAt)),
    );
  return NextResponse.json({ ok: true });
}
