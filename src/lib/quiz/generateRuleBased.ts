import type { Question } from '@/lib/types';

function splitSentences(content: string): string[] {
  return content
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 12);
}

/** Picks the longest word in the sentence as the thing to blank out — a
 * cheap proxy for "the word that matters most" without any NLP model. */
function pickKeyword(sentence: string): string | null {
  const words = sentence
    .replace(/[.,!?;:()"'«»]/g, '')
    .split(/\s+/)
    .filter((w) => w.length >= 4);
  if (words.length === 0) return null;
  return [...words].sort((a, b) => b.length - a.length)[0];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Deterministic, no-AI quiz generation: turns each candidate sentence into a
 * fill-in-the-blank question, using other keywords found in the same note as
 * distractors. This is what backs `generatedBy: 'rule-based'` — there's no
 * LLM call wired up in this app (no AI SDK dependency, no API key in the
 * secrets groups), so `mode: 'ai'` is rejected by the route rather than
 * silently falling back to this and mislabeling the result.
 *
 * Returns fewer than `count` questions if the note doesn't have enough
 * distinct, keyword-bearing sentences to fill the request.
 */
export function generateRuleBasedQuestions(
  content: string,
  count: number,
): Question[] {
  const candidates = splitSentences(content)
    .map((sentence) => ({ sentence, keyword: pickKeyword(sentence) }))
    .filter(
      (c): c is { sentence: string; keyword: string } => c.keyword !== null,
    );

  const allKeywords = Array.from(new Set(candidates.map((c) => c.keyword)));

  const questions: Question[] = [];
  for (const { sentence, keyword } of shuffle(candidates)) {
    if (questions.length >= count) break;

    const distractors = shuffle(
      allKeywords.filter((k) => k !== keyword),
    ).slice(0, 3);
    if (distractors.length === 0) continue; // no valid wrong answers available

    const options = shuffle([keyword, ...distractors]);
    questions.push({
      id: crypto.randomUUID(),
      prompt: `Хоосон зайг бөглөнө үү: "${sentence.replace(keyword, '_____')}"`,
      options,
      correctIndex: options.indexOf(keyword),
      explanation: sentence,
    });
  }

  return questions;
}
