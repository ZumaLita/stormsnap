// Streak rules (same for everyone, 8u–21u):
// - Every hour in the window where you post at least one snap keeps your 🔥 streak going.
// - Extra snaps earn a bonus 🛡️: a 2nd snap in the same hour (like 10u and 10u30),
//   or a snap outside 8u–21u. You can hold up to 3 bonuses.
// - Forget an hour? A bonus springs in and saves your streak. No bonus left: back to 0.
// - Storm (admin) can save a missed hour afterwards: it costs one of the bonuses you have now.
import type { Ionicons } from '@expo/vector-icons';

export const STREAK_START = 8;
export const STREAK_END = 21;
export const MAX_BONUS = 3;

export type StreakRow = { authorId: string; day: string; hour: number; save?: boolean };
export type SlotState = 'snap' | 'saved' | 'missed' | 'now' | 'future';

export type StreakStats = {
  current: number;
  best: number;
  bonus: number;
  total: number;
  today: Record<number, SlotState>;
  todaySnaps: number;
  earlyBird: boolean;
  nightOwl: boolean;
  fullDay: boolean;
  usedBonus: boolean;
  maxedBonus: boolean;
};

const parseDay = (d: string) => {
  const [y, m, dd] = d.split('-').map(Number);
  return new Date(y, m - 1, dd);
};
const fmt = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function computeStreak(rows: StreakRow[], now = new Date()): StreakStats {
  const today = fmt(now);
  const nowH = now.getHours();
  const counts = new Map<string, number>();
  const days = new Set<string>();
  let earlyBird = false;
  let nightOwl = false;
  const saves = new Set(rows.filter((r) => r.save).map((r) => `${r.day}|${r.hour}`));
  rows = rows.filter((r) => !r.save);
  let owed = 0;
  rows.forEach((r) => {
    const k = `${r.day}|${r.hour}`;
    counts.set(k, (counts.get(k) ?? 0) + 1);
    days.add(r.day);
    if (r.hour < STREAK_START) earlyBird = true;
    if (r.hour > STREAK_END) nightOwl = true;
  });

  const todayMap: Record<number, SlotState> = {};
  for (let h = STREAK_START; h <= STREAK_END; h++) {
    const c = counts.get(`${today}|${h}`) ?? 0;
    todayMap[h] = c > 0 ? 'snap' : h > nowH ? 'future' : h === nowH ? 'now' : 'missed';
  }

  const empty: StreakStats = {
    current: 0,
    best: 0,
    bonus: 0,
    total: rows.length,
    today: todayMap,
    todaySnaps: rows.filter((r) => r.day === today).length,
    earlyBird,
    nightOwl,
    fullDay: false,
    usedBonus: false,
    maxedBonus: false,
  };
  if (!rows.length) return empty;

  const sortedDays = [...days].sort();
  const first = sortedDays[0];
  const firstHour = Math.min(...rows.filter((r) => r.day === first).map((r) => r.hour));

  let streak = 0;
  let best = 0;
  let bonus = 0;
  let usedBonus = false;
  let maxedBonus = false;
  let fullDay = false;
  const addBonus = (n: number) => {
    bonus = Math.min(MAX_BONUS, bonus + n);
    if (bonus === MAX_BONUS) maxedBonus = true;
  };

  for (let d = parseDay(first); fmt(d) <= today; d.setDate(d.getDate() + 1)) {
    const day = fmt(d);
    const isToday = day === today;
    let snappedHours = 0;

    // Early snaps (before 8u) earn bonuses first.
    for (let h = 0; h < STREAK_START; h++) addBonus(counts.get(`${day}|${h}`) ?? 0);

    const startH = day === first ? Math.max(STREAK_START, firstHour) : STREAK_START;
    for (let h = startH; h <= STREAK_END; h++) {
      if (isToday && h > nowH) break;
      const c = counts.get(`${day}|${h}`) ?? 0;
      if (isToday && h === nowH && c === 0) break; // current hour is still open
      if (c > 0) {
        streak++;
        snappedHours++;
        if (c > 1) addBonus(c - 1);
      } else if (bonus > 0) {
        bonus--;
        usedBonus = true;
        streak++;
        if (isToday) todayMap[h] = 'saved';
      } else if (saves.has(`${day}|${h}`)) {
        // Saved afterwards: paid with a bonus earned later.
        owed++;
        usedBonus = true;
        streak++;
        if (isToday) todayMap[h] = 'saved';
      } else {
        streak = 0;
      }
      best = Math.max(best, streak);
    }
    if (snappedHours === STREAK_END - STREAK_START + 1) fullDay = true;

    // Late snaps (after 21u) earn bonuses at the end of the day.
    for (let h = STREAK_END + 1; h < 24; h++) addBonus(counts.get(`${day}|${h}`) ?? 0);
  }

  return { ...empty, total: rows.length, todaySnaps: rows.filter((r) => r.day === today).length, current: streak, best, bonus: Math.max(0, bonus - owed), usedBonus, maxedBonus, fullDay };
}

export type Badge = {
  key: string;
  title: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  unlocked: (s: StreakStats) => boolean;
};

export const BADGES: Badge[] = [
  { key: 'spark', title: 'Spark', hint: '3 hour streak', icon: 'flame-outline', color: '#FFB020', unlocked: (s) => s.best >= 3 },
  { key: 'flame', title: 'Flame', hint: '7 hour streak', icon: 'flame', color: '#FF8A1F', unlocked: (s) => s.best >= 7 },
  { key: 'blaze', title: 'Blaze', hint: '14 hour streak', icon: 'flame', color: '#FF5A1F', unlocked: (s) => s.best >= 14 },
  { key: 'inferno', title: 'Inferno', hint: '30 hour streak', icon: 'bonfire', color: '#F03A2E', unlocked: (s) => s.best >= 30 },
  { key: 'wildfire', title: 'Wildfire', hint: '60 hour streak', icon: 'bonfire', color: '#D61F69', unlocked: (s) => s.best >= 60 },
  { key: 'legend', title: 'Legend', hint: '100 hour streak', icon: 'trophy', color: '#F5B700', unlocked: (s) => s.best >= 100 },
  { key: 'fullday', title: 'Full day', hint: 'Snap all 14 hours', icon: 'calendar', color: '#3FA9F5', unlocked: (s) => s.fullDay },
  { key: 'early', title: 'Early bird', hint: 'Snap before 8u', icon: 'sunny', color: '#F5B700', unlocked: (s) => s.earlyBird },
  { key: 'owl', title: 'Night owl', hint: 'Snap after 21u', icon: 'moon', color: '#8C6CF0', unlocked: (s) => s.nightOwl },
  { key: 'saved', title: 'Saved!', hint: 'A bonus saved you', icon: 'shield-checkmark', color: '#3FA9F5', unlocked: (s) => s.usedBonus },
  { key: 'collector', title: 'Collector', hint: 'Hold 3 bonuses', icon: 'shield-half', color: '#2BB673', unlocked: (s) => s.maxedBonus },
  { key: 'hundred', title: '100 snaps', hint: 'Post 100 snaps', icon: 'camera', color: '#E2668F', unlocked: (s) => s.total >= 100 },
];
