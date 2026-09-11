import type { JournalAnswer } from '../local/state';
import {
  calendarMonth,
  categoryBreakdown,
  computeStats,
  formatLongDate,
  recentDays,
  weekdayIndex,
} from './stats';

function answer(localDate: string, questionId = 'q01'): JournalAnswer {
  return {
    id: `${localDate}:${questionId}`,
    localDate,
    questionId,
    questionText: 'soru',
    questionSetVersion: 'preview-tr-2026.1',
    body: 'cevap',
    createdAt: `${localDate}T09:00:00.000Z`,
    updatedAt: `${localDate}T09:00:00.000Z`,
  };
}

describe('computeStats', () => {
  it('returns an empty summary with no history', () => {
    const stats = computeStats([], '2026-09-11');
    expect(stats).toMatchObject({ answeredCount: 0, currentStreak: 0, longestStreak: 0, activeToday: false });
  });

  it('counts a consecutive run ending today', () => {
    const stats = computeStats(
      [answer('2026-09-09'), answer('2026-09-10'), answer('2026-09-11')],
      '2026-09-11',
    );
    expect(stats.answeredCount).toBe(3);
    expect(stats.currentStreak).toBe(3);
    expect(stats.longestStreak).toBe(3);
    expect(stats.activeToday).toBe(true);
  });

  it('keeps yesterday\'s run alive when today is not yet answered', () => {
    const stats = computeStats([answer('2026-09-09'), answer('2026-09-10')], '2026-09-11');
    expect(stats.currentStreak).toBe(2);
    expect(stats.activeToday).toBe(false);
  });

  it('drops the current run after a missed day but keeps the longest', () => {
    const stats = computeStats(
      [answer('2026-09-01'), answer('2026-09-02'), answer('2026-09-03'), answer('2026-09-10')],
      '2026-09-11',
    );
    expect(stats.longestStreak).toBe(3);
    expect(stats.currentStreak).toBe(1); // only the 10th, adjacent to today-1
  });

  it('ignores duplicate dates when counting', () => {
    const stats = computeStats([answer('2026-09-10'), answer('2026-09-10')], '2026-09-10');
    expect(stats.answeredCount).toBe(1);
  });
});

describe('recentDays', () => {
  it('returns the requested window ending today, marking answered days', () => {
    const cells = recentDays([answer('2026-09-10'), answer('2026-09-11')], '2026-09-11', 7);
    expect(cells).toHaveLength(7);
    expect(cells[cells.length - 1]).toMatchObject({ date: '2026-09-11', answered: true, isToday: true });
    expect(cells[cells.length - 2]).toMatchObject({ date: '2026-09-10', answered: true });
    expect(cells[0]?.answered).toBe(false);
  });
});

describe('calendarMonth', () => {
  it('builds Monday-first weeks covering the whole month', () => {
    const month = calendarMonth([answer('2026-09-11')], '2026-09-11', 2026, 8);
    expect(month.title).toBe('Eylül 2026');
    const flat = month.weeks.flat();
    const inMonthCount = flat.filter((cell) => cell.inMonth).length;
    expect(inMonthCount).toBe(30);
    const answeredEleventh = flat.some(
      (cell) => cell.inMonth && cell.date === '2026-09-11' && cell.answered,
    );
    expect(answeredEleventh).toBe(true);
    expect(month.weeks.every((week) => week.length === 7)).toBe(true);
  });
});

describe('categoryBreakdown', () => {
  it('groups answers by their question category', () => {
    const slices = categoryBreakdown([answer('2026-09-10', 'q01'), answer('2026-09-11', 'q04')]);
    const keys = slices.map((slice) => slice.key);
    expect(keys).toContain('daily_life');
    expect(keys).toContain('relationships');
    expect(slices.reduce((sum, slice) => sum + slice.count, 0)).toBe(2);
  });
});

describe('date helpers', () => {
  it('formats Turkish long dates', () => {
    expect(formatLongDate('2026-09-11')).toBe('11 Eylül 2026');
  });

  it('maps weekdays Monday-first', () => {
    expect(weekdayIndex('2026-09-11')).toBe(4); // Friday
    expect(weekdayIndex('2026-09-14')).toBe(0); // Monday
  });
});
