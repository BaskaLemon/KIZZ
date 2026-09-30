// Economy rules in one place. No server-only imports, so the UI can show the
// same numbers the server enforces.

/** A game only pays out coins/XP when at least this many people played —
 * otherwise a second account could farm first place. */
export const MIN_PLAYERS_FOR_REWARDS = 3;

/** Most coins a player can earn from live-game placements per day. */
export const DAILY_GAME_COIN_CAP = 1000;

/** XP for a game placement (rank 1..3); everyone else who scored gets the
 * participation amount. */
export const GAME_XP_BY_RANK: Record<number, number> = { 1: 100, 2: 60, 3: 30 };
export const GAME_XP_PARTICIPATION = 10;

export const STREAK_XP = 10;

/** First time a quiz assignment is completed (resubmitting earns nothing). */
export const assignmentXp = (score: number) => Math.round(score / 2);
export const assignmentCoins = (score: number) => Math.round(score / 10);

/** One-time "first steps" XP. */
export const FIRST_NOTE_XP = 20;
export const FIRST_QUIZ_XP = 30;

const TZ = 'Asia/Ulaanbaatar';

/** Calendar day (YYYY-MM-DD) in Ulaanbaatar — the app's "today". */
export function todayUb(now: Date = new Date()): string {
  return now.toLocaleDateString('en-CA', { timeZone: TZ });
}

/** Midnight at the start of today in Ulaanbaatar (UTC+8, no DST). */
export function startOfTodayUb(now: Date = new Date()): Date {
  return new Date(`${todayUb(now)}T00:00:00+08:00`);
}
