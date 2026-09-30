export interface LevelProgress {
  level: number;
  xp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
}

/** XP needed to go from `level` to `level + 1`: 100, 150, 200, ... */
export function xpToNextLevel(level: number): number {
  return 100 + 50 * (level - 1);
}

/** Total XP at which `level` starts. Level 1 starts at 0, level 2 at 100,
 * level 3 at 250, level 4 at 450, ... */
export function xpAtLevelStart(level: number): number {
  return 100 * (level - 1) + 25 * (level - 1) * (level - 2);
}

export function levelForXp(xp: number): LevelProgress {
  let level = 1;
  while (xp >= xpAtLevelStart(level + 1)) level++;
  return {
    level,
    xp,
    xpIntoLevel: xp - xpAtLevelStart(level),
    xpForNextLevel: xpToNextLevel(level),
  };
}
