import { createAvatar } from '@dicebear/core';
import {
  create as bigSmileCreate,
  meta as bigSmileMeta,
  schema as bigSmileSchema,
} from '@dicebear/big-smile';

const bigSmile = {
  create: bigSmileCreate,
  meta: bigSmileMeta,
  schema: bigSmileSchema,
};

export interface AvatarOptions {
  seed: string;
  hair: string;
  mouth: string;
  eyes: string;
  hairColor: string;
  skinColor: string;
  backgroundColor: string;
  accessory: string;
}

export const NO_ACCESSORY = 'none';

export const DEFAULT_AVATAR_OPTIONS: AvatarOptions = {
  seed: 'Felix',
  hair: 'shortHair',
  mouth: 'teethSmile',
  eyes: 'cheery',
  hairColor: '3a1a00',
  skinColor: 'e2ba87',
  backgroundColor: 'f09d0f',
  accessory: NO_ACCESSORY,
};

export const HAIR_STYLES = [
  'shortHair',
  'mohawk',
  'wavyBob',
  'bowlCutHair',
  'curlyBob',
  'straightHair',
  'braids',
  'shavedHead',
  'bunHair',
  'froBun',
  'bangs',
  'halfShavedHead',
  'curlyShortHair',
];

export const MOUTH_STYLES = [
  'openedSmile',
  'unimpressed',
  'gapSmile',
  'openSad',
  'teethSmile',
  'awkwardSmile',
  'braces',
  'kawaii',
];

export const EYE_STYLES = [
  'cheery',
  'normal',
  'confused',
  'starstruck',
  'winking',
  'sleepy',
  'sad',
  'angry',
];

export const HAIR_COLORS = [
  '220f00',
  '3a1a00',
  '71472d',
  'e2ba87',
  '605de4',
  '238d80',
  'd56c0c',
  'e9b729',
];

export const SKIN_COLORS = [
  'ffe4c0',
  'f5d7b1',
  'efcc9f',
  'e2ba87',
  'c99c62',
  'a47539',
  '8c5a2b',
  '643d19',
];

export const BACKGROUND_COLORS = [
  'f09d0f',
  'f8b4c4',
  'bde0fe',
  'b9fbc0',
  'fde68a',
  'd8b4fe',
];

export const ACCESSORIES = [
  NO_ACCESSORY,
  'catEars',
  'glasses',
  'sailormoonCrown',
  'clownNose',
  'sleepMask',
  'sunglasses',
  'faceMask',
  'mustache',
];

export function generateAvatarUri(options: AvatarOptions): string {
  const hasAccessory = options.accessory !== NO_ACCESSORY;
  return createAvatar(bigSmile, {
    seed: options.seed,
    hair: [options.hair as never],
    mouth: [options.mouth as never],
    eyes: [options.eyes as never],
    hairColor: [options.hairColor],
    skinColor: [options.skinColor],
    backgroundColor: [options.backgroundColor],
    accessories: hasAccessory ? [options.accessory as never] : [],
    accessoriesProbability: hasAccessory ? 100 : 0,
  }).toDataUri();
}

// Simple deterministic string hash (djb2-ish) — same input always produces
// the same output, so the same user id always maps to the same look.
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * A stable, per-account default avatar — different users get visibly
 * different looks out of the box (like a GitHub-style identicon) instead of
 * everyone sharing one fixed placeholder. Deterministic: the same id always
 * produces the same result, so it's safe to call on every render.
 */
export function avatarOptionsForUser(id: string): AvatarOptions {
  const pick = <T,>(list: T[], salt: string) =>
    list[hashString(`${id}:${salt}`) % list.length];
  return {
    seed: id,
    hair: pick(HAIR_STYLES, 'hair'),
    mouth: pick(MOUTH_STYLES, 'mouth'),
    eyes: pick(EYE_STYLES, 'eyes'),
    hairColor: pick(HAIR_COLORS, 'hairColor'),
    skinColor: pick(SKIN_COLORS, 'skinColor'),
    backgroundColor: pick(BACKGROUND_COLORS, 'backgroundColor'),
    accessory: NO_ACCESSORY,
  };
}

export function randomAvatarOptions(): AvatarOptions {
  const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
  return {
    seed: Math.random().toString(36).slice(2, 10),
    hair: pick(HAIR_STYLES),
    mouth: pick(MOUTH_STYLES),
    eyes: pick(EYE_STYLES),
    hairColor: pick(HAIR_COLORS),
    skinColor: pick(SKIN_COLORS),
    backgroundColor: pick(BACKGROUND_COLORS),
    accessory: pick(ACCESSORIES),
  };
}
