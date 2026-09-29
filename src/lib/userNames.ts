import { inArray } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { users } from '@/db/schema';

/** Batch id -> display name lookup, for resolving fields like
 * `note.updatedBy` into something a UI can show without an extra request
 * per row. */
export async function resolveUserNames(
  ids: string[],
): Promise<Map<string, string>> {
  const unique = Array.from(new Set(ids));
  if (unique.length === 0) return new Map();
  const rows = await getDb()
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(inArray(users.id, unique));
  return new Map(rows.map((row) => [row.id, row.name]));
}
