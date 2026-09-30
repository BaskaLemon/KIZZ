// Badge catalogue. Client-safe (no server imports): the profile page renders
// it and the server grants badges by key (see lib/points/badges.ts).

export interface BadgeDef {
  key: string;
  emoji: string;
  name: string;
  /** How to earn it — shown for locked badges too. */
  hint: string;
}

export const BADGES: BadgeDef[] = [
  { key: 'first_note', emoji: '✍️', name: 'Анхны тэмдэглэл', hint: 'Анхны тэмдэглэлээ бич' },
  { key: 'first_quiz', emoji: '🧠', name: 'Анхны quiz', hint: 'Тэмдэглэлээсээ анхны quiz-ээ үүсгэ' },
  { key: 'team_player', emoji: '🤝', name: 'Багийн тоглогч', hint: 'Бүлэгт нэгдэх эсвэл бүлэг үүсгэ' },
  { key: 'first_win', emoji: '🥇', name: 'Анхны ялалт', hint: '3+ тоглогчтой шууд тоглоомд 1-р байр ав' },
  { key: 'perfect_score', emoji: '💯', name: 'Төгс дүн', hint: 'Даалгаврын quiz-ээс 100% ав' },
  { key: 'streak_7', emoji: '🔥', name: '7 өдөр дараалан', hint: '7 өдөр дараалан урамшуулал ав' },
  { key: 'streak_30', emoji: '🌋', name: '30 өдөр дараалан', hint: '30 өдөр дараалан урамшуулал ав' },
  { key: 'level_5', emoji: '⭐', name: '5-р түвшин', hint: '5-р түвшинд хүр' },
  { key: 'level_10', emoji: '🌟', name: '10-р түвшин', hint: '10-р түвшинд хүр' },
  { key: 'popular_author', emoji: '📚', name: 'Алдартай зохиогч', hint: 'Нийтэлсэн quiz-ийг 5 хүн хуулж ав' },
];

export const BADGE_BY_KEY = new Map(BADGES.map((b) => [b.key, b]));
