import { useState } from 'react';
import { useHistory } from '@/hooks/use-api';
import { format, isToday, isYesterday, isSameYear } from 'date-fns';
import {
  CheckCircle2,
  Calendar,
  Filter,
  Trophy,
  Repeat,
  LayoutList,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DifficultyChip } from '@/components/ui/quest-meta-chip';
import type { QuestHistory } from '@/lib/api';

export function HistoryPage() {
  const { data: history, isLoading } = useHistory();

  const [filterType, setFilterType] = useState<string>('ALL');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const filteredHistory = history?.filter((item) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'DAILY') return item.recurrenceType === 'DAILY';
    if (filterType === 'HABIT') return item.recurrenceType !== 'NONE';
    if (filterType === 'PROJECT') return false;
    if (filterType === 'SUBQUEST') return !!item.parentTitle;
    return true;
  });

  const groupedHistory = filteredHistory?.reduce(
    (groups, item) => {
      const date = new Date(item.completedAt);
      const key = format(date, 'yyyy-MM-dd');
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    },
    {} as Record<string, QuestHistory[]>
  );

  const sortedDates = Object.keys(groupedHistory || {}).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">History</h1>
          <p className="text-muted-foreground">Your completed quests over time.</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="DAILY">Daily</SelectItem>
              <SelectItem value="HABIT">Habits</SelectItem>
              <SelectItem value="SUBQUEST">Subquests</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-8">
        {sortedDates.map((dateKey) => {
          const items = groupedHistory![dateKey];
          const date = new Date(dateKey);
          const totalXp = items.reduce((sum, item) => sum + item.xpEarned, 0);

          let dateLabel = format(date, 'EEEE, MMMM d');
          if (isToday(date)) dateLabel = 'Today';
          if (isYesterday(date)) dateLabel = 'Yesterday';
          if (!isSameYear(date, new Date())) dateLabel = format(date, 'EEEE, MMMM d, yyyy');

          return (
            <div key={dateKey} className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-semibold">{dateLabel}</h2>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {items.length} quests
                  </span>
                  <span className="flex items-center gap-1 text-amber-500/80">
                    <Trophy className="h-3.5 w-3.5" />
                    {totalXp} XP
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {items.map((quest) => (
                  <Card
                    key={quest.id}
                    className="group overflow-hidden border-l-[3px] transition-all hover:bg-muted/30"
                    style={{ borderLeftColor: quest.categoryColor || 'transparent' }}
                  >
                    <CardContent className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2 min-w-0">
                            {quest.categoryIcon && (
                              <span className="text-sm shrink-0">{quest.categoryIcon}</span>
                            )}
                            <span className="truncate font-medium leading-none">{quest.title}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {quest.parentTitle && (
                              <span className="flex items-center gap-1 rounded bg-primary/5 px-1.5 py-0.5 text-primary">
                                <ArrowRight className="h-3 w-3 shrink-0" />
                                <span className="truncate max-w-[120px]">
                                  Part of {quest.parentTitle}
                                </span>
                              </span>
                            )}
                            {quest.recurrenceType === 'DAILY' && (
                              <span className="flex items-center gap-1">
                                <Repeat className="h-3 w-3" /> Daily
                              </span>
                            )}
                            {quest.recurrenceType === 'WEEKLY' && (
                              <span className="flex items-center gap-1">
                                <Repeat className="h-3 w-3" /> Weekly
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 pl-11 sm:pl-0">
                        <DifficultyChip difficulty={quest.difficulty} />
                        <Badge
                          variant="secondary"
                          className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                        >
                          +{quest.xpEarned} XP
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

        {sortedDates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <LayoutList className="mb-4 h-12 w-12 opacity-20" />
            <p className="text-lg font-medium">No history found</p>
            <p className="text-sm">Complete quests to see them here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
