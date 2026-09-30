import type { Question } from '@/lib/types';

// Tried in order: Google retires models for new keys and returns 503 under
// load, so fall through to the next one on 404/429/5xx.
const MODELS = ['gemini-3.5-flash', 'gemini-flash-lite-latest', 'gemini-3.1-flash-lite'];
const MAX_NOTE_CHARS = 20_000;
const PER_MODEL_TIMEOUT_MS = 18_000;

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

  const requestBody = JSON.stringify({
    systemInstruction: {
      parts: [
        {
          text:
            'You write study quizzes. Reply with ONLY a JSON array. ' +
            'Each item: {"prompt": string, "options": [4 distinct strings], "correctIndex": 0-3, "explanation": string}. ' +
            "Write in the same language as the note. Questions must be answerable from the note's content alone. " +
            'Make every wrong option plausible: same grammatical form, similar length and specificity as the correct one, ' +
            'so the answer cannot be guessed from wording alone. Vary which index is correct.',
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
  });

  let res: Response | null = null;
  for (const model of MODELS) {
    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
          body: requestBody,
          // A slow model shouldn't hang the request — move on to the next.
          signal: AbortSignal.timeout(PER_MODEL_TIMEOUT_MS),
        },
      );
    } catch {
      res = null;
      continue;
    }
    if (res.ok) break;
    if (![404, 429, 500, 502, 503, 504].includes(res.status)) break;
  }
  if (!res || !res.ok) throw new Error(`Gemini API ${res?.status}`);

  const data = (await res.json()) as {
    candidates?: {
      content?: { parts?: { text?: string; thought?: boolean }[] };
    }[];
  };
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .filter((p) => !p.thought && typeof p.text === 'string')
    .map((p) => p.text)
    .join('');
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
