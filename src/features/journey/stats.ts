import { categoryLabel } from '@/theme/tokens';

import { QUESTIONS } from '../local/questions';
import type { JournalAnswer } from '../local/state';

/**
 * Gentle, non-punitive progress math derived purely from answered days.
 *
 * The product deliberately avoids streak penalties (see README): a missed day
 * simply is not counted. "Run" here means an unbroken chain of consecutive
 * calendar days, framed positively, never as something you are about to lose.
 */

const DAY_MS = 86_400_000;
const WEEKDAY_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTH_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export function toOrdinal(localDate: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDate);
  if (!match) throw new Error('Geçersiz yerel tarih.');
  return Math.floor(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / DAY_MS);
}

export function fromOrdinal(ordinal: number): string {
  const date = new Date(ordinal * DAY_MS);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Monday-first weekday index (0 = Monday … 6 = Sunday) for a local date. */
export function weekdayIndex(localDate: string): number {
  const jsDay = new Date(toOrdinal(localDate) * DAY_MS).getUTCDay(); // 0 = Sunday
  return (jsDay + 6) % 7;
}

export function formatLongDate(localDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDate);
  if (!match) return localDate;
  return `${Number(match[3])} ${MONTH_TR[Number(match[2]) - 1] ?? ''} ${match[1]}`;
}

export function monthTitle(year: number, monthIndex0: number): string {
  return `${MONTH_TR[monthIndex0] ?? ''} ${year}`;
}

export type JourneyStats = {
  answeredCount: number;
  currentStreak: number;
  longestStreak: number;
  activeToday: boolean;
  firstDate: string | null;
  lastDate: string | null;
};

export function answeredDateSet(history: JournalAnswer[]): Set<string> {
  return new Set(history.map((item) => item.localDate));
}

export function computeStats(history: JournalAnswer[], today: string | null): JourneyStats {
  const dates = Array.from(new Set(history.map((item) => item.localDate)))
    .map(toOrdinal)
    .sort((a, b) => a - b);

  if (dates.length === 0) {
    return {
      answeredCount: 0,
      currentStreak: 0,
      longestStreak: 0,
      activeToday: false,
      firstDate: null,
      lastDate: null,
    };
  }

  const first = dates[0]!;
  const last = dates[dates.length - 1]!;

  let longest = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i += 1) {
    run = dates[i]! === dates[i - 1]! + 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  // Current run counts back from the most recent answered day. It stays valid
  // as long as the last answer is today or yesterday, so a day still in
  // progress never erases yesterday's momentum.
  const set = new Set(dates);
  const todayOrd = today ? toOrdinal(today) : last;
  const activeToday = today ? set.has(todayOrd) : false;

  let currentStreak = 0;
  if (last >= todayOrd - 1) {
    let cursor = last;
    while (set.has(cursor)) {
      currentStreak += 1;
      cursor -= 1;
    }
  }

  return {
    answeredCount: dates.length,
    currentStreak,
    longestStreak: longest,
    activeToday,
    firstDate: fromOrdinal(first),
    lastDate: fromOrdinal(last),
  };
}

export type DayCell = { date: string; label: string; answered: boolean; isToday: boolean };

/** The last `count` calendar days ending today, oldest first. */
export function recentDays(history: JournalAnswer[], today: string, count = 14): DayCell[] {
  const set = answeredDateSet(history);
  const end = toOrdinal(today);
  const cells: DayCell[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const ord = end - i;
    const date = fromOrdinal(ord);
    cells.push({
      date,
      label: WEEKDAY_TR[weekdayIndex(date)] ?? '',
      answered: set.has(date),
      isToday: ord === end,
    });
  }
  return cells;
}

export type CalendarCell = (DayCell & { inMonth: true }) | { inMonth: false };
export type CalendarMonth = {
  year: number;
  monthIndex0: number;
  title: string;
  weekdayHeaders: string[];
  weeks: CalendarCell[][];
};

/** Monday-first month grid for a heatmap-style calendar. */
export function calendarMonth(
  history: JournalAnswer[],
  today: string,
  year?: number,
  monthIndex0?: number,
): CalendarMonth {
  const todayOrd = toOrdinal(today);
  const base = new Date(todayOrd * DAY_MS);
  const y = year ?? base.getUTCFullYear();
  const m = monthIndex0 ?? base.getUTCMonth();
  const set = answeredDateSet(history);

  const firstOfMonth = Math.floor(Date.UTC(y, m, 1) / DAY_MS);
  const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const leading = weekdayIndex(fromOrdinal(firstOfMonth));

  const flat: CalendarCell[] = [];
  for (let i = 0; i < leading; i += 1) flat.push({ inMonth: false });
  for (let day = 0; day < daysInMonth; day += 1) {
    const ord = firstOfMonth + day;
    const date = fromOrdinal(ord);
    flat.push({
      inMonth: true,
      date,
      label: String(day + 1),
      answered: set.has(date),
      isToday: ord === todayOrd,
    });
  }
  while (flat.length % 7 !== 0) flat.push({ inMonth: false });

  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < flat.length; i += 7) weeks.push(flat.slice(i, i + 7));

  return { year: y, monthIndex0: m, title: monthTitle(y, m), weekdayHeaders: WEEKDAY_TR, weeks };
}

export type CategorySlice = { key: string; label: string; count: number; ratio: number };

/** Distribution of answered questions across themes, most answered first. */
export function categoryBreakdown(history: JournalAnswer[]): CategorySlice[] {
  const byId = new Map(QUESTIONS.map((q) => [q.id, q.category] as const));
  const counts = new Map<string, number>();
  for (const answer of history) {
    const category = byId.get(answer.questionId);
    if (!category) continue;
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  const total = Array.from(counts.values()).reduce((sum, value) => sum + value, 0);
  return Array.from(counts.entries())
    .map(([key, count]) => ({ key, label: categoryLabel(key), count, ratio: total ? count / total : 0 }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'tr'));
}
