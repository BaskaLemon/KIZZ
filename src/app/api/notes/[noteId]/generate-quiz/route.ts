import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { notes, quizzes } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { canAccessNote } from '@/lib/access';
import { toQuiz } from '@/lib/mappers';
import { rateLimit } from '@/lib/rateLimit';
import { generateAiQuestions, isAiConfigured } from '@/lib/quiz/generateAi';
import { isUuid } from '@/lib/uuid';

/** Below this there is nothing meaningful to ask about. */
const MIN_NOTE_LENGTH = 30;

type Params = { params: Promise<{ noteId: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { noteId } = await params;
  if (!isUuid(noteId)) {
    return NextResponse.json({ error: 'Олдсонгүй.' }, { status: 404 });
  }

  const [note] = await getDb()
    .select()
    .from(notes)
    .where(eq(notes.id, noteId))
    .limit(1);
  if (!note || !(await canAccessNote(note, auth.user.id))) {
    return NextResponse.json(
      { error: 'Тэмдэглэл олдсонгүй.' },
      { status: 404 },
    );
  }

  const limited = rateLimit(`quizgen:${auth.user.id}`, 15, 10 * 60_000);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const count =
    typeof body?.count === 'number' && body.count > 0
      ? Math.min(Math.floor(body.count), 20)
      : 5;

  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: 'Quiz үүсгэх боломжгүй байна: AI тохируулагдаагүй (GEMINI_API_KEY).' },
      { status: 501 },
    );
  }
  if (note.content.trim().length < MIN_NOTE_LENGTH) {
    return NextResponse.json(
      {
        error:
          'Асуулт үүсгэхэд тэмдэглэлийн агуулга хангалтгүй байна. Дор хаяж хэдэн өгүүлбэр нэмнэ үү.',
      },
      { status: 400 },
    );
  }

  let questions;
  try {
    questions = await generateAiQuestions(note.content, count);
  } catch {
    return NextResponse.json(
      { error: 'AI асуулт үүсгэж чадсангүй. Дахин оролдоно уу.' },
      { status: 502 },
    );
  }
  if (questions.length === 0) {
    return NextResponse.json(
      {
        error:
          'Асуулт үүсгэхэд тэмдэглэлийн агуулга хангалтгүй байна. Дор хаяж хэдэн өгүүлбэр нэмнэ үү.',
      },
      { status: 400 },
    );
  }

  const [row] = await getDb()
    .insert(quizzes)
    .values({
      groupId: note.groupId,
      classId: note.classId,
      ownerId: note.ownerId,
      sourceNoteId: note.id,
      title: note.title,
      questions,
      generatedBy: 'ai',
    })
    .returning();

  return NextResponse.json(toQuiz(row), { status: 201 });
}
