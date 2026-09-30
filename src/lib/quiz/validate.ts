import type { Question } from '@/lib/types';

export const MAX_QUESTIONS = 50;
const MAX_PROMPT = 500;
const MAX_OPTION = 200;
const MAX_EXPLANATION = 500;
const MAX_TITLE = 120;

export function parseTitle(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const title = value.trim();
  return title && title.length <= MAX_TITLE ? title : null;
}

/** Validates a client-supplied question list. Returns the cleaned questions or
 * a user-facing error message. Ids are kept when present, generated when not. */
export function parseQuestions(value: unknown): Question[] | string {
  if (!Array.isArray(value) || value.length === 0) {
    return 'Дор хаяж нэг асуулт байх ёстой.';
  }
  if (value.length > MAX_QUESTIONS) {
    return `Асуулт ${MAX_QUESTIONS}-аас ихгүй байх ёстой.`;
  }
  const out: Question[] = [];
  for (const [i, raw] of value.entries()) {
    const n = i + 1;
    if (!raw || typeof raw !== 'object') return `${n}-р асуулт буруу байна.`;
    const q = raw as Record<string, unknown>;
    const prompt = typeof q.prompt === 'string' ? q.prompt.trim() : '';
    if (!prompt) return `${n}-р асуултын текстийг оруулна уу.`;
    if (prompt.length > MAX_PROMPT) return `${n}-р асуулт хэт урт байна.`;
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      return `${n}-р асуулт яг 4 сонголттой байх ёстой.`;
    }
    const options = q.options.map((o) => (typeof o === 'string' ? o.trim() : ''));
    if (options.some((o) => !o)) return `${n}-р асуултын бүх сонголтыг бөглөнө үү.`;
    if (options.some((o) => o.length > MAX_OPTION)) return `${n}-р асуултын сонголт хэт урт байна.`;
    if (new Set(options.map((o) => o.toLowerCase())).size !== 4) {
      return `${n}-р асуултын сонголтууд давхардсан байна.`;
    }
    const correctIndex = q.correctIndex;
    if (!Number.isInteger(correctIndex) || (correctIndex as number) < 0 || (correctIndex as number) > 3) {
      return `${n}-р асуултын зөв хариултыг сонгоно уу.`;
    }
    const explanation =
      typeof q.explanation === 'string' ? q.explanation.trim().slice(0, MAX_EXPLANATION) : '';
    out.push({
      id: typeof q.id === 'string' && q.id ? q.id : crypto.randomUUID(),
      prompt,
      options,
      correctIndex: correctIndex as number,
      explanation: explanation || undefined,
    });
  }
  return out;
}
