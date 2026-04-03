import { useMemo, useState } from 'react';
import { format, getDay, getDaysInMonth, startOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Flame, Target, Zap } from 'lucide-react';
import type { DailyStatsResponse } from '@/lib/api';
import type { DailyCompletionSnapshot } from '@/lib/activity-completion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ActivityHeatmapProps {
  dailyData: DailyStatsResponse[];
  completionByDate?: Record<string, DailyCompletionSnapshot>;
  isLoading?: boolean;
}

export function ActivityHeatmap({
  dailyData,
  completionByDate = {},
  isLoading = false,
}: ActivityHeatmapProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const monthlyData = useMemo(
    () =>
      dailyData.reduce(
        (acc, day) => {
          acc[day.date] = day;
          return acc;
        },
        {} as Record<string, DailyStatsResponse>
      ),
    [dailyData]
  );

  const currentMonthEntries = useMemo(
    () =>
      dailyData.filter((day) => {
        const date = new Date(day.date);
        return date.getFullYear() === year && date.getMonth() + 1 === month;
      }),
    [dailyData, month, year]
  );

  const monthQuestCount = currentMonthEntries.reduce((sum, day) => sum + day.questsCompleted, 0);
  const monthXp = currentMonthEntries.reduce((sum, day) => sum + day.xpEarned, 0);
  const activeDays = currentMonthEntries.filter((day) => day.questsCompleted > 0).length;

  const firstDayOfMonth = startOfMonth(currentDate);
  const startDayOfWeek = getDay(firstDayOfMonth);
  const daysInMonth = getDaysInMonth(currentDate);
  const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
  const today = new Date();

  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = [];

  for (let i = 0; i < adjustedStartDay; i++) {
    currentWeek.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  const canGoNext = () => {
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    return nextMonth <= new Date();
  };

  const getCompletionColor = (completion?: DailyCompletionSnapshot) => {
    if (!completion || completion.plannedQuests === 0) return 'bg-muted/35';
    if (completion.completionRate >= 100) return 'bg-primary';
    if (completion.completionRate >= 75) return 'bg-primary/75';
    if (completion.completionRate >= 50) return 'bg-primary/52';
    return 'bg-primary/38';
  };

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="space-y-4 px-5 pb-0 pt-5 sm:px-6 sm:pt-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Activity</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              A compact view of your monthly consistency.
            </p>
          </div>
          <div className="flex items-center rounded-full border border-border/60 bg-background/70 p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={() =>
                setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[88px] text-center text-xs font-medium text-muted-foreground">
              {format(currentDate, 'MMM yyyy')}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={() =>
                setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
              }
              disabled={!canGoNext()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
        {isLoading ? (
          <div className="flex min-h-[220px] items-center justify-center text-sm text-muted-foreground">
            Loading activity...
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-5 text-sm">
              <div className="inline-flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">{monthQuestCount}</span>
                <span className="text-muted-foreground">quests</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <Flame className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">{activeDays}</span>
                <span className="text-muted-foreground">active days</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">+{monthXp}</span>
                <span className="text-muted-foreground">XP gained</span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {weeks.flat().map((day, index) => {
                if (day === null) {
                  return <div key={index} className="aspect-square" />;
                }

                const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayData = monthlyData[dateKey];
                const completion = completionByDate[dateKey];
                const xpEarned = dayData?.xpEarned ?? 0;
                const dayDate = new Date(year, month - 1, day);
                const isFuture = dayDate > today;
                const isToday = dayDate.toDateString() === today.toDateString();

                return (
                  <TooltipProvider key={index} delayDuration={90}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            'aspect-square rounded-[0.7rem] border border-transparent transition-all',
                            isFuture ? 'bg-muted/25' : getCompletionColor(completion),
                            isToday &&
                              'border-primary/70 shadow-[0_0_0_1px_theme(colors.primary/25)]',
                            !isFuture && 'hover:-translate-y-0.5 hover:border-primary/20'
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-medium">{format(dayDate, 'EEE, MMM d')}</p>
                        {isFuture ? (
                          <p className="text-muted-foreground">Upcoming</p>
                        ) : !completion || completion.plannedQuests === 0 ? (
                          <p className="text-muted-foreground">No quests planned</p>
                        ) : (
                          <>
                            <p className="text-muted-foreground">
                              {completion.completedQuests} of {completion.plannedQuests} quest
                              {completion.plannedQuests === 1 ? '' : 's'} completed
                            </p>
                            <p className="text-muted-foreground">
                              {completion.completionRate}% • +{xpEarned} XP
                            </p>
                          </>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[3px] bg-muted/35" />
                none
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[3px] bg-primary/38" />
                {'<50%'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[3px] bg-primary/52" />
                50-74%
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[3px] bg-primary/75" />
                75-99%
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[3px] bg-primary" />
                100%
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
