import { useMemo, useState } from 'react';
import { format, getDay, getDaysInMonth, startOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DailyStatsResponse } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MonthlyActivityGraphProps {
  className?: string;
  title?: string;
  dailyData?: DailyStatsResponse[];
  isLoading?: boolean;
  xpEarned?: number;
  activeDays?: number;
  questsCompleted?: number;
}

export function MonthlyActivityGraph({
  className,
  title = 'Monthly Activity',
  dailyData = [],
  isLoading = false,
  xpEarned = 0,
  activeDays = 0,
  questsCompleted = 0,
}: MonthlyActivityGraphProps) {
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

  const getCompletionColor = (completed: number) => {
    if (completed === 0) return 'bg-muted/40';
    if (completed >= 5) return 'bg-primary';
    if (completed >= 3) return 'bg-primary/60';
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
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{title}</span>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="w-16 text-center text-xs text-muted-foreground">
              {format(currentDate, 'MMM yyyy')}
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
          <div className="flex gap-4">
            <div className="flex flex-1 items-center justify-center py-2">
              <div className="grid grid-cols-7 gap-[3px] sm:gap-1">
                {weeks.flat().map((day, index) => {
                  if (day === null) {
                    return <div key={index} className="h-4 w-4 sm:h-5 sm:w-5" />;
                  }

                  const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayData = monthlyData[dateKey];
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
                              'h-4 w-4 cursor-default rounded-[3px] transition-all sm:h-5 sm:w-5',
                              'hover:ring-1 hover:ring-foreground/30',
                              isFuture ? 'bg-muted/30' : getCompletionColor(questsCompletedForDay),
                              isToday && 'ring-2 ring-primary/60'
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-medium">{format(dayDate, 'EEE, MMM d')}</p>
                          {isFuture ? (
                            <p className="text-muted-foreground">Upcoming</p>
                          ) : questsCompletedForDay === 0 ? (
                            <p className="text-muted-foreground">No quests completed</p>
                          ) : (
                            <p className="text-muted-foreground">
                              {questsCompletedForDay} completed
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </div>

            <div className="w-px bg-border/20" />

            <div className="flex min-w-[85px] flex-1 flex-col justify-center pl-4">
              <div className="space-y-4">
                <div>
                  <p className="text-xl font-semibold leading-none">{questsCompleted}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">quests</p>
                </div>
                <div>
                  <p className="text-xl font-semibold leading-none">{activeDays}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">active days</p>
                </div>
                <div>
                  <p className="text-xl font-semibold leading-none">+{xpEarned}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">XP</p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-1">
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="h-2.5 w-2.5 cursor-default rounded-[2px] bg-muted/40 hover:ring-1 hover:ring-foreground/20" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      No required quests
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="h-2.5 w-2.5 cursor-default rounded-[2px] bg-primary/30 hover:ring-1 hover:ring-foreground/20" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      Some quests completed
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="h-2.5 w-2.5 cursor-default rounded-[2px] bg-primary/60 hover:ring-1 hover:ring-foreground/20" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      Most quests completed
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="h-2.5 w-2.5 cursor-default rounded-[2px] bg-primary hover:ring-1 hover:ring-foreground/20" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      All quests completed
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
