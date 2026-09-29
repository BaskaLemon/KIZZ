import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { users } from '@/db/schema';
import { getAuthenticatedUser } from '@/lib/auth/session';
import {
  ACCESSORIES,
  BACKGROUND_COLORS,
  EYE_STYLES,
  HAIR_COLORS,
  HAIR_STYLES,
  MOUTH_STYLES,
  SKIN_COLORS,
  type AvatarOptions,
} from '@/lib/avatar';

function parseAvatarOptions(body: unknown): AvatarOptions | null {
  if (typeof body !== 'object' || body === null) return null;
  const b = body as Record<string, unknown>;
  if (typeof b.seed !== 'string') return null;
  if (typeof b.hair !== 'string' || !HAIR_STYLES.includes(b.hair)) return null;
  if (typeof b.mouth !== 'string' || !MOUTH_STYLES.includes(b.mouth)) return null;
  if (typeof b.eyes !== 'string' || !EYE_STYLES.includes(b.eyes)) return null;
  if (typeof b.hairColor !== 'string' || !HAIR_COLORS.includes(b.hairColor)) return null;
  if (typeof b.skinColor !== 'string' || !SKIN_COLORS.includes(b.skinColor)) return null;
  if (
    typeof b.backgroundColor !== 'string' ||
    !BACKGROUND_COLORS.includes(b.backgroundColor)
  ) {
    return null;
  }
  if (typeof b.accessory !== 'string' || !ACCESSORIES.includes(b.accessory)) return null;

  return {
    seed: b.seed,
    hair: b.hair,
    mouth: b.mouth,
    eyes: b.eyes,
    hairColor: b.hairColor,
    skinColor: b.skinColor,
    backgroundColor: b.backgroundColor,
    accessory: b.accessory,
  };
}

export async function PATCH(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Нэвтрээгүй байна.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const options = parseAvatarOptions(body);
  if (!options) {
    return NextResponse.json({ error: 'Аватарын өгөгдөл буруу байна.' }, { status: 400 });
  }

  await getDb()
    .update(users)
    .set({ avatarOptions: options })
    .where(eq(users.id, user.id));

  return NextResponse.json({ avatarOptions: options });
}
