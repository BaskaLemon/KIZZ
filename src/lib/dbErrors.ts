/** Drizzle wraps the underlying `postgres` driver error (which carries the
 * real Postgres error code) inside a `DrizzleQueryError`, putting it on
 * `.cause` rather than the top-level error — so `err.code` is always
 * `undefined` on a caught transaction error. This reads the real code. */
export function pgErrorCode(err: unknown): string | undefined {
  if (err && typeof err === 'object' && 'cause' in err) {
    const cause = (err as { cause?: unknown }).cause;
    if (cause && typeof cause === 'object' && 'code' in cause) {
      return (cause as { code?: unknown }).code as string | undefined;
    }
  }
  return undefined;
}

export const UNIQUE_VIOLATION = '23505';
