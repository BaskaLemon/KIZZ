// One-off config seeder. Run with:
//   set -a; source .env.local; set +a; bun run src/db/seed.ts
// Re-running is safe — it upserts, so edit the numbers below and re-run
// any time you want to retune the reward curve.
import { sql } from 'drizzle-orm';
import { getDb } from './client';
import { placementRewards, shopItems, streakConfig } from './schema';

async function main() {
  const db = getDb();

  // Quiz / tournament placement rewards. rank 0 = fallback for any
  // finisher whose rank isn't listed here (e.g. "participation" points).
  await db
    .insert(placementRewards)
    .values([
      { rank: 1, points: 500 },
      { rank: 2, points: 300 },
      { rank: 3, points: 150 },
      { rank: 0, points: 10 },
    ])
    .onConflictDoUpdate({
      target: placementRewards.rank,
      set: { points: sql`excluded.points` },
    });

  // Daily streak curve: day N reward = min(base + (N-1) * increment, max).
  // 10, 20, 30, ... capped at 100.
  await db
    .insert(streakConfig)
    .values({ id: 1, basePoints: 10, incrementPoints: 10, maxPoints: 100 })
    .onConflictDoUpdate({
      target: streakConfig.id,
      set: { basePoints: 10, incrementPoints: 10, maxPoints: 100 },
    });

  // The avatar store: every item is a whole ready-made look — `value` is the
  // complete, ready-to-render DiceBear image URL. To add more: pick any
  // style at https://www.dicebear.com/styles, tweak its params on that page,
  // copy the resulting URL as `value`. No migration, no new code needed —
  // just add another object to this array and re-run this script.
  await db
    .insert(shopItems)
    .values([
      {
        name: 'Persik Thumbs аватар',
        category: 'avatarPreset',
        value:
          'https://api.dicebear.com/10.x/thumbs/svg?backgroundColor=ffd9b0,ffa8bf&backgroundColorFill=linear&backgroundColorAngle=135&shapeColor=fff4e8',
        price: 300,
      },
      {
        name: 'Adventurer аватар',
        category: 'avatarPreset',
        value:
          'https://api.dicebear.com/10.x/adventurer/svg?backgroundColor=ffe3ea,e3edff,e2f5e9,fdf1d4,efe6ff',
        price: 300,
      },
      {
        name: 'Avataaars аватар',
        category: 'avatarPreset',
        value:
          'https://api.dicebear.com/10.x/avataaars/svg?backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf,d9f2d9',
        price: 300,
      },
      {
        name: 'Big Ears аватар',
        category: 'avatarPreset',
        value:
          'https://api.dicebear.com/10.x/big-ears/svg?backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf,d9f2d9',
        price: 300,
      },
      {
        name: 'Tiny botts аватар',
        category: 'avatarPreset',
        value:
          'https://api.dicebear.com/10.x/bottts/svg?backgroundColor=ffe3ea,e3edff,e2f5e9,fdf1d4,efe6ff',
        price: 300,
      },
      {
        name: 'Dylan аватар',
        category: 'avatarPreset',
        value:
          'https://api.dicebear.com/10.x/dylan/svg?facialHairProbability=0',
        price: 300,
      },
      {
        name: 'Lorelei аватар',
        category: 'avatarPreset',
        value:
          'https://api.dicebear.com/10.x/lorelei/svg?backgroundColor=ffe3ea,e3edff,e2f5e9,fdf1d4,efe6ff',
        price: 300,
      },
      {
        name: 'Voxel аватар',
        category: 'avatarPreset',
        value:
          'https://api.dicebear.com/10.x/voxel-art/svg?backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf,d9f2d9',
        price: 300,
      },
      {
        name: 'Toon Heads аватар',
        category: 'avatarPreset',
        value:
          'https://api.dicebear.com/10.x/toon-head/svg?backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf,d9f2d9',
        price: 300,
      },
      {
        name: 'Notionists аватар',
        category: 'avatarPreset',
        value:
          'https://api.dicebear.com/10.x/notionists/svg?backgroundColor=ffe3ea,e3edff,e2f5e9,fdf1d4,efe6ff',
        price: 300,
      },
      {
        name: 'Micah аватар',
        category: 'avatarPreset',
        value:
          'https://api.dicebear.com/10.x/micah/svg?backgroundColor=ffe3ea,e3edff,e2f5e9,fdf1d4,efe6ff',
        price: 300,
      },
      {
        name: 'Croodles аватар',
        category: 'avatarPreset',
        value:
          'https://api.dicebear.com/10.x/croodles/svg?backgroundColor=ffe3ea,e3edff,e2f5e9,fdf1d4,efe6ff',
        price: 300,
      },
    ])
    .onConflictDoNothing();

  console.log('Seed done.');
}

main().then(() => process.exit(0));
