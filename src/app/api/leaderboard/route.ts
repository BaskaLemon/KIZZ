import { NextResponse } from 'next/server';
import { and, asc, desc, eq, gt, or, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { classCoTeachers, classMembers, users } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { getClassMembership } from '@/lib/access';
import { levelForXp } from '@/lib/points/level';
import { isUuid } from '@/lib/uuid';

const LIMIT = 20;

/** XP leaderboard. `?scope=global` (default) lists everyone who has not opted
 * out; `?scope=class&classId=…` ranks the members of a group the caller is in
 * (members already see each other, so the opt-out doesn't apply there). */
export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const url = new URL(request.url);
  const scope = url.searchParams.get('scope') === 'class' ? 'class' : 'global';
  const db = getDb();

  const cols = {
    id: users.id,
    name: users.name,
    xp: users.xp,
    avatarOptions: users.avatarOptions,
    equippedItemId: users.equippedItemId,
  };
  type Row = { id: string; name: string; xp: number; avatarOptions: unknown; equippedItemId: string | null };
  let rows: Row[];
  let myRank: number | null = null;
  let myXp = 0;

  if (scope === 'class') {
    const classId = url.searchParams.get('classId') ?? '';
    if (!isUuid(classId)) return NextResponse.json({ error: 'Олдсонгүй.' }, { status: 404 });
    const { klass, isMember } = await getClassMembership(classId, auth.user.id);
    if (!klass || !isMember) return NextResponse.json({ error: 'Бүлэг олдсонгүй.' }, { status: 404 });

    const memberIds = or(
      eq(users.id, klass.teacherId),
      sql`${users.id} in (select ${classMembers.studentId} from ${classMembers} where ${classMembers.classId} = ${classId})`,
      sql`${users.id} in (select ${classCoTeachers.teacherId} from ${classCoTeachers} where ${classCoTeachers.classId} = ${classId})`,
    );
    rows = await db.select(cols).from(users).where(memberIds).orderBy(desc(users.xp), asc(users.name)).limit(LIMIT);
    const [me] = await db.select({ xp: users.xp }).from(users).where(eq(users.id, auth.user.id)).limit(1);
    myXp = me?.xp ?? 0;
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(users)
      .where(and(memberIds, gt(users.xp, myXp)));
    myRank = n + 1;
  } else {
    rows = await db
      .select(cols)
      .from(users)
      .where(eq(users.showOnLeaderboard, true))
      .orderBy(desc(users.xp), asc(users.name))
      .limit(LIMIT);
    const [me] = await db
      .select({ xp: users.xp, visible: users.showOnLeaderboard })
      .from(users)
      .where(eq(users.id, auth.user.id))
      .limit(1);
    myXp = me?.xp ?? 0;
    if (me?.visible) {
      const [{ n }] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(users)
        .where(and(eq(users.showOnLeaderboard, true), gt(users.xp, myXp)));
      myRank = n + 1;
    }
  }

  return NextResponse.json({
    scope,
    // Ties share a rank, like the caller's own rank below.
    rows: rows.map((r, i) => ({
      rank: rows.findIndex((x) => x.xp === r.xp) + 1 || i + 1,
      id: r.id,
      name: r.name,
      xp: r.xp,
      level: levelForXp(r.xp).level,
      avatarOptions: r.avatarOptions,
      equippedItemId: r.equippedItemId,
      isMe: r.id === auth.user.id,
    })),
    me: { rank: myRank, xp: myXp, level: levelForXp(myXp).level },
  });
}
