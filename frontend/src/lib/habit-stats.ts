import { getUtcDateKey } from '@/lib/activity-completion';
import type { QuestHistoryResponse } from '@/lib/api';
import type { RecurrenceType } from '@/lib/quest-config';

export type StreakUnit = 'day' | 'week' | 'month';

export interface HabitStats {
  /** UTC day keys (YYYY-MM-DD) with at least one completion */
  dayKeys: Set<string>;
  streak: number;
  streakUnit: StreakUnit;
  /** Completions in the last 30 days */
  count30: number;
}

export function groupCompletionsByQuest(items: QuestHistoryResponse[]): Map<string, Date[]> {
  const map = new Map<string, Date[]>();
  for (const item of items) {
    (map.get(item.questId) ?? map.set(item.questId, []).get(item.questId)!).push(
      new Date(item.completedAt)
    );
  }
  return map;
}

function addUtcDays(date: Date, days: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function startOfUtcWeek(date: Date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return addUtcDays(d, -((d.getUTCDay() + 6) % 7));
}

function utcMonthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function prevUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1));
}

/**
 * Counts consecutive periods with a completion, walking back from `now`.
 * The current period is a grace period: an empty current period does not
 * break the streak, it just is not counted yet.
 */
function countStreak(has: (d: Date) => boolean, prev: (d: Date) => Date, now: Date) {
  let cursor = has(now) ? now : prev(now);
  let streak = 0;
  while (has(cursor)) {
    streak++;
    cursor = prev(cursor);
  }
  return streak;
}

export function streakUnitFor(recurrence: RecurrenceType): StreakUnit {
  if (recurrence === 'WEEKLY') return 'week';
  if (recurrence === 'MONTHLY') return 'month';
  return 'day';
}

export function computeHabitStats(
  completions: Date[],
  recurrence: RecurrenceType,
  now = new Date()
): HabitStats {
  const dayKeys = new Set(completions.map(getUtcDateKey));
  const streakUnit = streakUnitFor(recurrence);

  let streak: number;
  if (streakUnit === 'week') {
    const weekKeys = new Set(completions.map((d) => getUtcDateKey(startOfUtcWeek(d))));
    streak = countStreak(
      (d) => weekKeys.has(getUtcDateKey(startOfUtcWeek(d))),
      (d) => addUtcDays(startOfUtcWeek(d), -7),
      now
    );
  } else if (streakUnit === 'month') {
    const monthKeys = new Set(completions.map(utcMonthKey));
    streak = countStreak((d) => monthKeys.has(utcMonthKey(d)), prevUtcMonth, now);
  } else {
    streak = countStreak(
      (d) => dayKeys.has(getUtcDateKey(d)),
      (d) => addUtcDays(d, -1),
      now
    );
  }

  const cutoff = addUtcDays(now, -30);
  const count30 = completions.filter((d) => d >= cutoff).length;

  return { dayKeys, streak, streakUnit, count30 };
}

/** Last `days` UTC day keys, oldest first, ending today. */
export function lastUtcDayKeys(days: number, now = new Date()) {
  return Array.from({ length: days }, (_, i) => getUtcDateKey(addUtcDays(now, -(days - 1 - i))));
}
