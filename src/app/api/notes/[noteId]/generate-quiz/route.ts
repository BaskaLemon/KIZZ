import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { notes, quizzes } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { canAccessNote } from '@/lib/access';
import { toQuiz } from '@/lib/mappers';
import { generateAiQuestions, isAiConfigured } from '@/lib/quiz/generateAi';
import { generateRuleBasedQuestions } from '@/lib/quiz/generateRuleBased';

type Params = { params: Promise<{ noteId: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { noteId } = await params;

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

  const body = await request.json().catch(() => null);
  const count =
    typeof body?.count === 'number' && body.count > 0
      ? Math.min(Math.floor(body.count), 20)
      : 5;
  const mode = typeof body?.mode === 'string' ? body.mode : 'rule-based';

  const useAi = mode === 'ai';
  if (useAi && !isAiConfigured()) {
    return NextResponse.json(
      { error: 'AI quiz тохируулагдаагүй байна (GEMINI_API_KEY). Дүрэмт горим ашиглана уу.' },
      { status: 501 },
    );
  }

  let questions;
  try {
    questions = useAi
      ? await generateAiQuestions(note.content, count)
      : generateRuleBasedQuestions(note.content, count);
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
      sourceNoteId: note.id,
      title: note.title,
      questions,
      generatedBy: useAi ? 'ai' : 'rule-based',
    })
    .returning();

  return NextResponse.json(toQuiz(row), { status: 201 });
}
