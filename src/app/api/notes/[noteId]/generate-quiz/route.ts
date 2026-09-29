import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { notes, quizzes } from '@/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { canAccessNote } from '@/lib/access';
import { toQuiz } from '@/lib/mappers';
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

  if (mode === 'ai') {
    // No LLM is wired up in this deployment — no AI SDK dependency and no
    // API key in the secrets manager. Fail loudly rather than silently
    // generating a rule-based quiz and mislabeling it `generatedBy: 'ai'`.
    return NextResponse.json(
      {
        error:
          'AI quiz generation is not configured for this app yet. Use rule-based mode.',
      },
      { status: 501 },
    );
  }

  const questions = generateRuleBasedQuestions(note.content, count);
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
      generatedBy: 'rule-based',
    })
    .returning();

  return NextResponse.json(toQuiz(row), { status: 201 });
}
