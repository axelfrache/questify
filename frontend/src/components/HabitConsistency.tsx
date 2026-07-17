import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StreakBadge } from '@/components/ui/streak-badge';
import { computeHabitStats, lastUtcDayKeys } from '@/lib/habit-stats';
import type { RecurrenceType } from '@/lib/quest-config';
import { cn } from '@/lib/utils';

const DOT_DAYS = 14;

interface HabitConsistencyProps {
  completions: Date[];
  recurrence: RecurrenceType;
  color?: string;
}

export function HabitConsistency({ completions, recurrence, color }: HabitConsistencyProps) {
  const { t } = useTranslation();

  const stats = useMemo(
    () => computeHabitStats(completions, recurrence),
    [completions, recurrence]
  );
  const days = useMemo(() => lastUtcDayKeys(DOT_DAYS), []);

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-1" aria-hidden>
        {days.map((dayKey) => {
          const done = stats.dayKeys.has(dayKey);
          return (
            <span
              key={dayKey}
              title={dayKey}
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                done && !color && 'bg-primary',
                !done && 'bg-muted-foreground/20'
              )}
              style={done && color ? { background: color } : undefined}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-2.5">
        <span className="font-mono text-[11px] text-muted-foreground">
          {t('habits.done_30d', { count: stats.count30 })}
        </span>
        {stats.streak > 0 && (
          <StreakBadge className="px-2 py-0.5 text-[10px]">
            {t('habits.streak_' + stats.streakUnit, { count: stats.streak })}
          </StreakBadge>
        )}
      </div>
    </div>
  );
}
