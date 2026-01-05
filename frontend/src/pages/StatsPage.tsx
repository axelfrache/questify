import {
  useWeeklyStats,
  useMonthlyStats,
  useRegionActivity,
  useWeeklyCompletionRates,
} from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RegionRadarChart } from '@/components/ui/region-radar-chart';
import { MonthlyActivityGraph } from '@/components/ui/monthly-activity-graph';
import { Calendar, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatsPage() {
  const { data: weeklyStats, isLoading: isLoadingWeekly } = useWeeklyStats();
  const { data: monthlyStats, isLoading: isLoadingMonthly } = useMonthlyStats();
  const { data: regionActivity, isLoading: isLoadingRegion } = useRegionActivity();
  const { data: weeklyCompletion, isLoading: isLoadingCompletion } = useWeeklyCompletionRates();

  const isLoading = isLoadingWeekly || isLoadingMonthly || isLoadingRegion || isLoadingCompletion;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  const getCompletionFillHeight = (rate: number) => {
    return Math.min(rate, 100);
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 100) return 'bg-green-500';
    if (rate >= 75) return 'bg-emerald-500';
    if (rate >= 50) return 'bg-primary';
    if (rate > 0) return 'bg-primary/60';
    return 'bg-muted';
  };

  const today = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stats</h1>
          <p className="text-muted-foreground">Your activity and consistency over time.</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-2 rounded-full hover:bg-muted transition-colors">
                <Info className="h-5 w-5 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="text-sm">
                Stats reflect short-term activity and may vary from day to day.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Weekly Consistency
            </CardTitle>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">
                  {weeklyStats?.questsCompleted || 0}
                </span>{' '}
                quests
              </span>
              <span>
                <span className="font-medium text-foreground">+{weeklyStats?.xpEarned || 0}</span>{' '}
                XP
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex items-end gap-2 h-24">
            {weeklyCompletion?.map((day, index) => {
              const dayDate = new Date(day.date);
              const isFuture = dayDate > today;
              const rate = day.completionRate;
              const hasPlanned = day.plannedQuests > 0;

              return (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex items-end justify-center h-16">
                          <div
                            className={cn(
                              'w-full max-w-8 rounded-t transition-all',
                              isFuture
                                ? 'bg-muted/30'
                                : hasPlanned
                                  ? getCompletionColor(rate)
                                  : 'bg-muted/50'
                            )}
                            style={{
                              height: isFuture
                                ? '20%'
                                : hasPlanned
                                  ? `${Math.max(getCompletionFillHeight(rate), 8)}%`
                                  : '8%',
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {dayDate.toLocaleDateString('en-US', { weekday: 'narrow' })}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isFuture ? (
                        <p className="text-xs">Upcoming</p>
                      ) : hasPlanned ? (
                        <p className="text-xs">
                          {day.completedQuests} of {day.plannedQuests} ({rate}%)
                        </p>
                      ) : (
                        <p className="text-xs">No planned quests</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
          <div className="mt-2 pt-2 border-t flex items-center justify-end gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-green-500" />
              100%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-primary/60" />
              Partial
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-muted/50" />
              None
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2 items-stretch">
        <MonthlyActivityGraph
          xpEarned={monthlyStats?.xpEarned || 0}
          activeDays={monthlyStats?.activeDays || 0}
          questsCompleted={monthlyStats?.questsCompleted || 0}
        />

        {regionActivity && <RegionRadarChart data={regionActivity} />}
      </div>
    </div>
  );
}
