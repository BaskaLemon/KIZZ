import { beforeEach, describe, expect, it } from 'bun:test';
import { levelForXp } from '@/lib/points/level';
import { isUuid } from '@/lib/uuid';
import { normalizeMime } from '@/lib/materials';
import { matchesSignature } from '@/lib/fileSignature';
import { rateLimit, resetRateLimits } from '@/lib/rateLimit';
import { generateRuleBasedQuestions } from '@/lib/quiz/generateRuleBased';
import { optionalText } from '@/lib/text';
import { randomCode } from '@/lib/codes';

describe('levelForXp', () => {
  it('starts at level 1 and gains a level every 100 xp', () => {
    expect(levelForXp(0)).toMatchObject({ level: 1, xpIntoLevel: 0 });
    expect(levelForXp(99)).toMatchObject({ level: 1, xpIntoLevel: 99 });
    expect(levelForXp(100)).toMatchObject({ level: 2, xpIntoLevel: 0 });
    expect(levelForXp(500).level).toBe(6);
  });
});

describe('isUuid', () => {
  it('accepts uuids and rejects everything else', () => {
    expect(isUuid('986ddfdb-e9d0-4370-9530-62e9fa056967')).toBe(true);
    expect(isUuid('not-a-uuid')).toBe(false);
    expect(isUuid('undefined')).toBe(false);
    expect(isUuid('')).toBe(false);
  });
});

describe('normalizeMime', () => {
  it('strips parameters and lowercases', () => {
    expect(normalizeMime('text/plain;charset=utf-8')).toBe('text/plain');
    expect(normalizeMime('IMAGE/PNG')).toBe('image/png');
    expect(normalizeMime('')).toBe('application/octet-stream');
  });
});

describe('matchesSignature', () => {
  const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  it('accepts matching content', () => {
    expect(matchesSignature('image/png', png)).toBe(true);
    expect(matchesSignature('application/pdf', Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d]))).toBe(true);
    expect(matchesSignature('image/jpeg', Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]))).toBe(true);
    expect(matchesSignature('text/plain;charset=utf-8', new TextEncoder().encode('hello'))).toBe(true);
  });
  it('rejects mismatched or unknown content', () => {
    expect(matchesSignature('image/png', Uint8Array.from([1, 2, 3, 4]))).toBe(false);
    expect(matchesSignature('application/pdf', png)).toBe(false);
    expect(matchesSignature('text/plain', Uint8Array.from([104, 0, 105]))).toBe(false);
    expect(matchesSignature('application/x-msdownload', png)).toBe(false);
  });
});

describe('rateLimit', () => {
  beforeEach(resetRateLimits);
  it('allows up to the limit then returns 429 with Retry-After', () => {
    for (let i = 0; i < 3; i++) expect(rateLimit('k', 3, 60_000)).toBeNull();
    const blocked = rateLimit('k', 3, 60_000);
    expect(blocked?.status).toBe(429);
    expect(Number(blocked?.headers.get('Retry-After'))).toBeGreaterThan(0);
  });
  it('tracks keys independently', () => {
    for (let i = 0; i < 3; i++) rateLimit('a', 3, 60_000);
    expect(rateLimit('b', 3, 60_000)).toBeNull();
  });
});

describe('generateRuleBasedQuestions', () => {
  const note =
    'Мицохондри бол эсийн эрчим хүчний үүсгүүр юм. Хлоропласт нь фотосинтез явуулдаг эсийн хэсэг юм. ' +
    'Рибосом нь уураг нийлэгжүүлдэг эсийн бүтэц юм. Цөм нь удамшлын мэдээллийг хадгалдаг эсийн төв юм.';
  it('builds 4-option questions with a valid correct index', () => {
    const qs = generateRuleBasedQuestions(note, 3);
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) {
      expect(q.options).toHaveLength(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(4);
    }
  });
  it('returns nothing for an empty note and never exceeds the count', () => {
    expect(generateRuleBasedQuestions('', 5)).toEqual([]);
    expect(generateRuleBasedQuestions(note, 2).length).toBeLessThanOrEqual(2);
  });
});

describe('optionalText / randomCode', () => {
  it('trims to null for blank input', () => {
    expect(optionalText('  ')).toBeNull();
    expect(optionalText(' hi ')).toBe('hi');
    expect(optionalText(5)).toBeNull();
  });
  it('makes codes of the requested length', () => {
    expect(randomCode(5)).toHaveLength(5);
  });
});
