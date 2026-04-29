import { useHistory, useCategories } from '@/hooks/use-api';
import { format, isToday, isYesterday, isSameYear } from 'date-fns';
import { Calendar, Check, Filter, LayoutList } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { XpBadge } from '@/components/ui/xp-badge';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import type { QuestHistoryResponse } from '@/lib/api';

function dateLabel(dateKey: string) {
  const date = new Date(dateKey + 'T12:00:00');
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (!isSameYear(date, new Date())) return format(date, 'EEEE, MMM d, yyyy');
  return format(date, 'EEEE, MMM d');
}

function timeLabel(completedAt: string) {
  const d = new Date(completedAt);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function HistoryPage() {
  const { data: history, isLoading } = useHistory();
  const { data: categories } = useCategories();
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const categoryColor = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of categories ?? []) map[c.name] = c.color;
    return map;
  }, [categories]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-14 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const items = history?.content ?? [];

  const filtered =
    categoryFilter === 'ALL' ? items : items.filter((i) => i.categoryName === categoryFilter);

  const grouped = filtered.reduce(
    (acc, item) => {
      const key = item.completedAt.slice(0, 10);
      (acc[key] ??= []).push(item);
      return acc;
    },
    {} as Record<string, QuestHistoryResponse[]>
  );

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const uniqueCategories = Array.from(new Set(items.map((i) => i.categoryName).filter(Boolean)));

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">History</h1>
          <p className="text-sm text-muted-foreground">Your completed quests over time</p>
        </div>

        {/* Category filter */}
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={cn(
              'flex cursor-pointer appearance-none items-center gap-2 rounded-md border border-border bg-card',
              'pl-8 pr-3 py-1.5 text-sm text-foreground outline-none',
              'hover:bg-muted/50 transition-colors'
            )}
          >
            <option value="ALL">All regions</option>
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat!}>
                {cat}
              </option>
            ))}
          </select>
          <Filter className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      {/* Groups */}
      {sortedDates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <LayoutList className="mb-3 h-10 w-10 opacity-20" />
          <p className="text-sm font-medium">No history yet</p>
          <p className="text-xs opacity-70">Complete quests to see them here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateKey) => {
            const dayItems = grouped[dateKey];
            const totalXp = dayItems.reduce((s, i) => s + i.xpEarned, 0);

            return (
              <div key={dateKey}>
                {/* Day header */}
                <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-semibold">{dateLabel(dateKey)}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                    <span>{dayItems.length} quests</span>
                    <span className="text-primary">+{totalXp} XP</span>
                  </div>
                </div>

                {/* Quest rows */}
                <div className="space-y-1.5">
                  {dayItems.map((quest) => (
                    <div
                      key={quest.questId}
                      className="flex items-center gap-3 rounded-md border border-border bg-card px-3.5 py-2.5"
                    >
                      {/* Completed checkbox */}
                      <div className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[4px] bg-primary">
                        <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                      </div>

                      {/* Title */}
                      <span className="flex-1 truncate text-sm text-muted-foreground line-through">
                        {quest.questTitle}
                      </span>

                      {/* Category dot */}
                      {quest.categoryName && categoryColor[quest.categoryName] && (
                        <span
                          className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                          style={{ background: categoryColor[quest.categoryName] }}
                        />
                      )}

                      {/* Time */}
                      <span className="flex-shrink-0 font-mono text-[11px] text-muted-foreground">
                        {timeLabel(quest.completedAt)}
                      </span>

                      {/* XP badge */}
                      <XpBadge xp={quest.xpEarned} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
