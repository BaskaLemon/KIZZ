import { NextResponse } from 'next/server';
import { and, count, desc, eq, isNull } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { notifications } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const db = getDb();

  const [rows, [{ unread }]] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, auth.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(30),
    db
      .select({ unread: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, auth.user.id),
          isNull(notifications.readAt),
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
