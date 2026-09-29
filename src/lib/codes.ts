// Excludes visually ambiguous characters (0/O, 1/I/L).
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function randomCode(length = 5): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return out;
}

/**
 * Generates a short join code and retries on collision. `isAvailable` should
 * check the candidate against the database and resolve to `true` if it's
 * free. Throws if no free code is found within `maxAttempts` — with a
 * 5-character charset of 32 symbols that's only plausible if the table is
 * nearly exhausted.
 */
export async function generateUniqueCode(
  isAvailable: (candidate: string) => Promise<boolean>,
  length = 5,
  maxAttempts = 10,
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = randomCode(length);
    if (await isAvailable(candidate)) return candidate;
  }
  throw new Error('Could not generate a unique code after several attempts.');
}
