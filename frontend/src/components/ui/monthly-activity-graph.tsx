import { useMemo, useState } from 'react';
import { format, getDay, getDaysInMonth, startOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DailyStatsResponse } from '@/lib/api';
import type { DailyCompletionSnapshot } from '@/lib/activity-completion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MonthlyActivityGraphProps {
  className?: string;
  dailyData?: DailyStatsResponse[];
  completionByDate?: Record<string, DailyCompletionSnapshot>;
  isLoading?: boolean;
}

export function MonthlyActivityGraph({
  className,
  dailyData = [],
  completionByDate = {},
  isLoading = false,
}: MonthlyActivityGraphProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const currentMonthKey = `${year}-${String(month).padStart(2, '0')}`;

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
    () => dailyData.filter((day) => day.date.startsWith(currentMonthKey)),
    [currentMonthKey, dailyData]
  );

  const monthQuestCount = currentMonthEntries.reduce((sum, day) => sum + day.questsCompleted, 0);
  const monthXp = currentMonthEntries.reduce((sum, day) => sum + day.xpEarned, 0);
  const activeDays = currentMonthEntries.filter((day) => day.questsCompleted > 0).length;

  const goToPreviousMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    if (nextMonth <= new Date()) {
      setCurrentDate(nextMonth);
    }
  };

  const canGoNext = () => {
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    return nextMonth <= new Date();
  };

  const getCompletionColor = (completion?: DailyCompletionSnapshot) => {
    if (!completion || (completion.plannedQuests === 0 && completion.completedQuests === 0))
      return 'bg-muted/40';
    if (completion.completionRate >= 100) return 'bg-primary';
    if (completion.completionRate >= 75) return 'bg-primary/65';
    if (completion.completionRate >= 50) return 'bg-primary/45';
    return 'bg-primary/30';
  };

  const firstDayOfMonth = startOfMonth(currentDate);
  const startDayOfWeek = getDay(firstDayOfMonth);
  const daysInMonth = getDaysInMonth(currentDate);
  const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

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

  const today = new Date();

  return (
    <Card className={cn('min-h-[220px]', className)}>
      <CardHeader className="px-4 py-3">
        <div className="flex items-center justify-end">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="w-20 text-center font-mono text-xs text-muted-foreground">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={goToNextMonth}
              disabled={!canGoNext()}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-0">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
            Loading...
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-1 items-center justify-center py-1">
              <div className="grid w-full grid-cols-7 gap-[4px]">
                {weeks.flat().map((day, index) => {
                  if (day === null) {
                    return <div key={index} className="h-4 w-4 sm:h-5 sm:w-5" />;
                  }

                  const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayData = monthlyData[dateKey];
                  const completion = completionByDate[dateKey];
                  const questsCompletedForDay = dayData?.questsCompleted ?? 0;
                  const dayDate = new Date(year, month - 1, day);
                  const isFuture = dayDate > today;
                  const isToday = dayDate.toDateString() === today.toDateString();

                  return (
                    <TooltipProvider key={index} delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'relative z-0 aspect-square cursor-default rounded-[3px] transition-all',
                              'hover:z-10 hover:ring-1 hover:ring-inset hover:ring-foreground/30',
                              isFuture ? 'bg-muted/30' : getCompletionColor(completion),
                              isToday && 'ring-2 ring-inset ring-primary/60'
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-medium">{format(dayDate, 'EEE, MMM d')}</p>
                          {isFuture ? (
                            <p className="text-muted-foreground">Upcoming</p>
                          ) : !completion ||
                            (completion.plannedQuests === 0 &&
                              completion.completedQuests === 0) ? (
                            <p className="text-muted-foreground">No quests planned</p>
                          ) : (
                            <>
                              <p className="text-muted-foreground">
                                {completion.completedQuests} of {completion.plannedQuests} completed
                              </p>
                              <p className="text-muted-foreground">
                                {completion.completionRate}% • +
                                {questsCompletedForDay > 0 ? (dayData?.xpEarned ?? 0) : 0} XP
                              </p>
                            </>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </div>

            {/* Monthly summary stats */}
            <div className="flex items-center gap-4 text-xs">
              <span>
                <span className="font-mono font-medium text-foreground">{monthQuestCount}</span>
                <span className="ml-1 text-muted-foreground">quests</span>
              </span>
              <span>
                <span className="font-mono font-medium text-foreground">{activeDays}</span>
                <span className="ml-1 text-muted-foreground">active days</span>
              </span>
              <span>
                <span className="font-mono font-medium text-foreground">+{monthXp}</span>
                <span className="ml-1 text-muted-foreground">XP</span>
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
