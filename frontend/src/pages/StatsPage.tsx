import {
  useStatsOverview,
  useStatsByCategory,
  useStatsByDay,
  useCategories,
} from '@/hooks/use-api';
import { useTranslation } from 'react-i18next';
import { useDailyCompletion } from '@/hooks/use-daily-completion';
import { getUtcDateKey } from '@/lib/activity-completion';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MonthlyActivityGraph } from '@/components/ui/monthly-activity-graph';
import { StreakBadge } from '@/components/ui/streak-badge';
import { Calendar, LayoutGrid, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

export function StatsPage() {
  const { t, i18n } = useTranslation();
  const { data: overview, isLoading: isLoadingOverview } = useStatsOverview();
  const { data: categoryStats, isLoading: isLoadingCategories } = useStatsByCategory();
  const { data: categories } = useCategories();
  const { data: dailyStats, isLoading: isLoadingDaily } = useStatsByDay(7);
  const { data: monthlyActivityStats, isLoading: isLoadingMonthlyActivity } = useStatsByDay(365);
  const { completionByDate, isLoading: isLoadingCompletion } = useDailyCompletion();

  const isLoading =
    isLoadingOverview ||
    isLoadingCategories ||
    isLoadingDaily ||
    isLoadingMonthlyActivity ||
    isLoadingCompletion;

  const today = new Date();
  const dailyStatsByDate = Object.fromEntries((dailyStats ?? []).map((d) => [d.date, d]));

  const weeklyDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - (6 - index));
    const dateKey = getUtcDateKey(date);
    return {
      date,
      dateKey,
      stats: dailyStatsByDate[dateKey],
      completion: completionByDate[dateKey],
    };
  });

  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
  const weekStart = weeklyDays[0].date.toLocaleDateString(locale, {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
  });
  const weekEnd = weeklyDays[6].date.toLocaleDateString(locale, {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const weeklyActiveDays = weeklyDays.filter(
    (d) => (d.completion?.completedQuests ?? 0) > 0
  ).length;
  const weeklyXp = weeklyDays.reduce((sum, d) => sum + (d.stats?.xpEarned ?? 0), 0);

  // By region: compute percentages, join with category colors
  const regionData = useMemo(() => {
    if (!categoryStats || categoryStats.length === 0) return [];
    const activeRegionStats = categoryStats.filter(
      (c) => c.questsCompleted > 0 && categories?.some((cat) => cat.name === c.categoryName)
    );
    const total = activeRegionStats.reduce((s, c) => s + c.questsCompleted, 0) || 1;
    return activeRegionStats
      .map((c) => ({
        name: c.categoryName,
        count: c.questsCompleted,
        pct: Math.round((c.questsCompleted / total) * 100),
        color:
          categories?.find((cat) => cat.name === c.categoryName)?.color ?? 'oklch(0.56 0.18 275)',
      }))
      .sort((a, b) => b.pct - a.pct);
  }, [categoryStats, categories]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 w-48" />
        <Skeleton className="h-44 w-full" />
        <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('stats.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('stats.description')}</p>
      </div>

      {/* Weekly Consistency */}
      <div className="rounded-lg border bg-card p-5">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-medium">{t('stats.weekly_consistency')}</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {weekStart} – {weekEnd}
            </p>
          </div>
          <div className="flex items-start gap-5">
            {(overview?.currentStreak ?? 0) > 0 && (
              <StreakBadge>{t('stats.streak', { count: overview!.currentStreak })}</StreakBadge>
            )}
            <div className="text-right">
              <p className="font-mono text-lg font-medium leading-none">{weeklyActiveDays}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{t('stats.active_days')}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-lg font-medium leading-none">+{weeklyXp}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">XP</p>
            </div>
          </div>
        </div>

        {/* Fixed-height stripe chart */}
        <TooltipProvider delayDuration={100}>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center gap-2">
              {weeklyDays.map((day, i) => {
                const isFuture = day.date > today;
                const rate = day.completion?.completionRate ?? 0;
                const planned = day.completion?.plannedQuests ?? 0;

                const barClass =
                  isFuture || planned === 0
                    ? 'bg-muted/40'
                    : rate >= 100
                      ? 'bg-primary'
                      : rate >= 50
                        ? 'bg-primary/55'
                        : 'bg-primary/30';

                return (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <div className="flex flex-1 cursor-default flex-col items-center gap-2">
                        <div
                          className={cn('h-1 w-full rounded-full transition-colors', barClass)}
                        />
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {day.date.toLocaleDateString(locale, {
                            timeZone: 'UTC',
                            weekday: 'narrow',
                          })}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isFuture ? (
                        <p className="text-xs">{t('stats.upcoming')}</p>
                      ) : planned === 0 ? (
                        <p className="text-xs">{t('stats.no_quests_planned')}</p>
                      ) : (
                        <>
                          <p className="text-xs">
                            {t('stats.completed_of', {
                              completed: day.completion?.completedQuests ?? 0,
                              planned,
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t('stats.rate_xp', { rate, xp: day.stats?.xpEarned ?? 0 })}
                          </p>
                        </>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </TooltipProvider>

        {/* Legend */}
        <div className="mt-3 flex items-center justify-end gap-3 text-[10px] text-muted-foreground">
          {[
            { label: t('stats.full'), cls: 'bg-primary' },
            { label: t('stats.partial'), cls: 'bg-primary/55' },
            { label: t('stats.none'), cls: 'bg-muted/50' },
          ].map(({ label, cls }) => (
            <span key={label} className="flex items-center gap-1">
              <span className={cn('h-2 w-2 rounded-[2px]', cls)} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Monthly + By region */}
      <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
        {/* Monthly activity — reuse existing component, pass icon override via className */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="flex items-center gap-1.5 px-5 pt-4 pb-0">
            <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">{t('stats.monthly_activity')}</span>
          </div>
          <MonthlyActivityGraph
            dailyData={monthlyActivityStats}
            completionByDate={completionByDate}
            isLoading={isLoadingMonthlyActivity}
            className="border-0 shadow-none bg-transparent"
          />
        </div>

        {/* By region */}
        <div className="rounded-lg border bg-card p-5">
          <div className="mb-4 flex items-center gap-1.5">
            <Map className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">{t('stats.by_region')}</span>
          </div>

          {regionData.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('stats.no_region_activity')}</p>
          ) : (
            <div className="space-y-3">
              {regionData.map((r) => (
                <div key={r.name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                      {r.name}
                    </span>
                    <span className="font-mono text-muted-foreground">{r.pct}%</span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-muted/40">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${r.pct}%`, background: r.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
