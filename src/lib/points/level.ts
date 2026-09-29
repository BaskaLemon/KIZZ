const XP_PER_LEVEL = 100;

export interface LevelProgress {
  level: number;
  xp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
}

/** Level 1 starts at 0 xp; every XP_PER_LEVEL xp earns another level. */
export function levelForXp(xp: number): LevelProgress {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  return {
    level,
    xp,
    xpIntoLevel: xp % XP_PER_LEVEL,
    xpForNextLevel: XP_PER_LEVEL,
  };
}
