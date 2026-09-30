/** `''`/missing/non-string → null, otherwise trimmed. Used for optional
 * free-text fields (e.g. a group's description) shared by
 * create and edit routes. */
export function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
