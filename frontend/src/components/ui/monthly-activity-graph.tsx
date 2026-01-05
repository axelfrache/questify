import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMonthlyCompletionRates } from '@/hooks/use-api';
import { cn } from '@/lib/utils';
import { format, startOfMonth, getDay, getDaysInMonth } from 'date-fns';

interface MonthlyActivityGraphProps {
  className?: string;
  xpEarned?: number;
  activeDays?: number;
  questsCompleted?: number;
}

export function MonthlyActivityGraph({
  className,
  xpEarned = 0,
  activeDays = 0,
  questsCompleted = 0,
}: MonthlyActivityGraphProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: monthlyData, isLoading } = useMonthlyCompletionRates(year, month);

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

  const getCompletionColor = (rate: number | null, plannedQuests: number) => {
    if (plannedQuests === 0 || rate === null) return 'bg-muted/20';
    if (rate >= 100) return 'bg-primary';
    if (rate >= 50) return 'bg-primary/60';
    if (rate > 0) return 'bg-primary/30';
    return 'bg-muted/40';
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
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Monthly Activity</span>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs text-muted-foreground w-16 text-center">
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
          <div className="h-32 flex items-center justify-center text-muted-foreground text-xs">
            Loading...
          </div>
        ) : (
          <div className="flex gap-4">
            <div className="flex-1 flex items-center justify-center py-2">
              <div className="grid grid-cols-7 gap-[3px] sm:gap-1">
                {weeks.flat().map((day, index) => {
                  if (day === null) {
                    return <div key={index} className="w-4 h-4 sm:w-5 sm:h-5" />;
                  }

                  const dayData = monthlyData?.[day - 1];
                  const rate = dayData?.completionRate ?? null;
                  const plannedQuests = dayData?.plannedQuests ?? 0;
                  const completedQuests = dayData?.completedQuests ?? 0;

                  const dayDate = new Date(year, month - 1, day);
                  const isFuture = dayDate > today;
                  const isToday = dayDate.toDateString() === today.toDateString();

                  return (
                    <TooltipProvider key={index} delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'w-4 h-4 sm:w-5 sm:h-5 rounded-[3px] cursor-default transition-all',
                              'hover:ring-1 hover:ring-foreground/30',
                              isFuture ? 'bg-muted/15' : getCompletionColor(rate, plannedQuests),
                              isToday && 'ring-2 ring-primary/60'
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-medium">{format(dayDate, 'EEE, MMM d')}</p>
                          {isFuture ? (
                            <p className="text-muted-foreground">Upcoming</p>
                          ) : plannedQuests === 0 ? (
                            <p className="text-muted-foreground">No required quests</p>
                          ) : (
                            <p className="text-muted-foreground">
                              {rate}% ({completedQuests}/{plannedQuests})
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

            <div className="flex-1 flex flex-col justify-center min-w-[85px] pl-4">
              <div className="space-y-4">
                <div>
                  <p className="text-xl font-semibold leading-none">{questsCompleted}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">quests</p>
                </div>
                <div>
                  <p className="text-xl font-semibold leading-none">{activeDays}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">active days</p>
                </div>
                <div>
                  <p className="text-xl font-semibold leading-none">+{xpEarned}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">XP</p>
                </div>
              </div>

              <div className="flex items-center gap-1 mt-5">
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="w-2.5 h-2.5 rounded-[2px] bg-muted/20 cursor-default hover:ring-1 hover:ring-foreground/20" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      No required quests
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="w-2.5 h-2.5 rounded-[2px] bg-primary/30 cursor-default hover:ring-1 hover:ring-foreground/20" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      Some quests completed
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="w-2.5 h-2.5 rounded-[2px] bg-primary/60 cursor-default hover:ring-1 hover:ring-foreground/20" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      Most quests completed
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="w-2.5 h-2.5 rounded-[2px] bg-primary cursor-default hover:ring-1 hover:ring-foreground/20" />
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
