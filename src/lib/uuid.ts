const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Route ids are uuids; a malformed one would otherwise reach Postgres and
 * surface as a 500 instead of a 404. */
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
