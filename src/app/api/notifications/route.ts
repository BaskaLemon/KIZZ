import { NextResponse } from 'next/server';
import { and, count, desc, eq, isNotNull, isNull } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { notifications } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { ensureDueReminders } from '@/lib/reminders';

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  await ensureDueReminders(auth.user.id);
  const db = getDb();

  const [rows, [{ unread }]] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, auth.user.id), isNull(notifications.dismissedAt)))
      .orderBy(desc(notifications.createdAt))
      .limit(30),
    db
      .select({ unread: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, auth.user.id),
          isNull(notifications.readAt),
          isNull(notifications.dismissedAt),
        ),
      ),
  ]);

  return NextResponse.json({
    unread,
    items: rows.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      href: r.href,
      read: r.readAt !== null,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

/** Clear all of the caller's notifications. Generated reminders are only
 * hidden (so they are not re-created); everything else is deleted. */
export async function DELETE(request: Request) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const db = getDb();
  await db
    .update(notifications)
    .set({ dismissedAt: new Date(), readAt: new Date() })
    .where(and(eq(notifications.userId, auth.user.id), isNotNull(notifications.dedupeKey), isNull(notifications.dismissedAt)));
  await db
    .delete(notifications)
    .where(and(eq(notifications.userId, auth.user.id), isNull(notifications.dedupeKey)));
  return NextResponse.json({ ok: true });
}
