import type { Question } from '@/lib/types';

const MODEL = 'gemini-2.5-flash';
const MAX_NOTE_CHARS = 20_000;

export class AiNotConfiguredError extends Error {}

/** Whether `mode: 'ai'` can work in this deployment. */
export function isAiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

function isValidQuestion(q: unknown): q is Omit<Question, 'id'> {
  if (!q || typeof q !== 'object') return false;
  const x = q as Record<string, unknown>;
  return (
    typeof x.prompt === 'string' &&
    x.prompt.trim().length > 0 &&
    Array.isArray(x.options) &&
    x.options.length === 4 &&
    x.options.every((o) => typeof o === 'string' && o.trim().length > 0) &&
    Number.isInteger(x.correctIndex) &&
    (x.correctIndex as number) >= 0 &&
    (x.correctIndex as number) < 4
  );
}

/** Generates multiple-choice questions from a note via the Gemini
 * API (plain fetch — no SDK dependency). Throws
 * `AiNotConfiguredError` without an API key. */
export async function generateAiQuestions(
  content: string,
  count: number,
): Promise<Question[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AiNotConfiguredError();

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text:
                'You write study quizzes. Reply with ONLY a JSON array. ' +
                'Each item: {"prompt": string, "options": [4 distinct strings], "correctIndex": 0-3, "explanation": string}. ' +
                "Write in the same language as the note. Questions must be answerable from the note's content alone.",
            },
          ],
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Create ${count} multiple-choice questions from this note:\n\n${content.slice(0, MAX_NOTE_CHARS)}`,
              },
            ],
          },
        ],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini API ${res.status}`);

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('AI returned no JSON');

  const parsed: unknown = JSON.parse(text.slice(start, end + 1));
  if (!Array.isArray(parsed)) throw new Error('AI returned invalid JSON');

  return parsed
    .filter(isValidQuestion)
    .slice(0, count)
    .map((q) => ({
      id: crypto.randomUUID(),
      prompt: q.prompt,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: typeof q.explanation === 'string' ? q.explanation : undefined,
    }));
}
