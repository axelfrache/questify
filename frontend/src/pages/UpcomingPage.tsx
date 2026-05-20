import { useMemo, useState } from 'react';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Repeat2 } from 'lucide-react';
import { useProjectsList, useQuests } from '@/hooks/use-api';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { QuestResponse, ProjectSummaryResponse } from '@/lib/api';

const PROJECT_PALETTE = [
  '#6366f1',
  '#0ea5e9',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
];

type Section = 'tomorrow' | 'thisWeek' | 'nextWeek' | 'later';

const SECTION_LABELS: Record<Section, string> = {
  tomorrow: 'Tomorrow',
  thisWeek: 'Rest of this week',
  nextWeek: 'Next week',
  later: 'Later',
};

const SECTION_ORDER: Section[] = ['tomorrow', 'thisWeek', 'nextWeek', 'later'];

function getSection(date: Date, today: Date): Section {
  const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 });
  const endOfNextWeek = endOfWeek(addDays(endOfThisWeek, 1), { weekStartsOn: 1 });
  const tomorrow = addDays(today, 1);
  if (isSameDay(date, tomorrow)) return 'tomorrow';
  if (date <= endOfThisWeek) return 'thisWeek';
  if (date <= endOfNextWeek) return 'nextWeek';
  return 'later';
}

function MiniCalendar({
  viewMonth,
  onPrev,
  onNext,
  questDates,
}: {
  viewMonth: Date;
  onPrev: () => void;
  onNext: () => void;
  questDates: Set<string>;
}) {
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold">{format(viewMonth, 'MMMM yyyy')}</span>
        <div className="flex gap-0.5">
          <button
            onClick={onPrev}
            className="flex h-6 w-6 items-center justify-center rounded transition-colors text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onNext}
            className="flex h-6 w-6 items-center justify-center rounded transition-colors text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-medium text-muted-foreground/60 py-1"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const hasQuests = questDates.has(dateStr) && isSameMonth(day, viewMonth);
          const isCurrentDay = isToday(day);
          const inMonth = isSameMonth(day, viewMonth);

          return (
            <div key={dateStr} className="flex flex-col items-center py-0.5">
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-[11px] tabular-nums transition-colors',
                  isCurrentDay && 'bg-primary text-primary-foreground font-semibold',
                  !isCurrentDay && inMonth && 'text-foreground',
                  !inMonth && 'text-muted-foreground/30'
                )}
              >
                {format(day, 'd')}
              </div>
              <div
                className={cn(
                  'h-1 w-1 rounded-full mt-0.5',
                  hasQuests ? 'bg-primary/70' : 'invisible'
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function UpcomingQuestRow({ quest, accentColor }: { quest: QuestResponse; accentColor: string }) {
  const isRecurring = quest.recurrenceInterval !== 'NONE';
  const recurrenceLabel: Record<string, string> = {
    DAILY: 'Daily',
    WEEKLY: 'Weekly',
    MONTHLY: 'Monthly',
    CUSTOM: 'Custom',
  };

  return (
    <div className="relative flex items-center gap-3 rounded-md border bg-card px-4 py-3 overflow-hidden">
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-md"
        style={{ backgroundColor: accentColor }}
      />
      <div className="h-4 w-4 shrink-0 rounded border border-muted-foreground/25 ml-1" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{quest.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {isRecurring ? (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Repeat2 className="h-3 w-3 shrink-0" />
              {recurrenceLabel[quest.recurrenceInterval] ?? quest.recurrenceInterval}
            </span>
          ) : quest.category ? (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span
                className="h-2 w-2 shrink-0 rounded-sm"
                style={{ backgroundColor: quest.category.color }}
              />
              {quest.category.icon && <span>{quest.category.icon}</span>}
              {quest.category.name}
            </span>
          ) : null}
        </div>
      </div>
      <span className="shrink-0 font-mono text-xs font-medium text-primary">
        +{quest.totalXpReward}
      </span>
    </div>
  );
}

export function UpcomingPage() {
  const { data: quests, isLoading } = useQuests(undefined, 'upcoming');
  const { data: projects } = useProjectsList('', 'name', false);
  const [viewMonth, setViewMonth] = useState(() => new Date());

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const projectColorMap = useMemo(() => {
    const map = new Map<string, string>();
    (projects ?? []).forEach((p, i) => map.set(p.id, PROJECT_PALETTE[i % PROJECT_PALETTE.length]));
    return map;
  }, [projects]);

  const projectMap = useMemo(() => {
    const map = new Map<string, ProjectSummaryResponse>();
    (projects ?? []).forEach((p) => map.set(p.id, p));
    return map;
  }, [projects]);

  const getAccentColor = (quest: QuestResponse): string => {
    if (quest.category?.color) return quest.category.color;
    if (quest.projectId) return projectColorMap.get(quest.projectId) ?? PROJECT_PALETTE[0];
    if (quest.recurrenceInterval !== 'NONE') return '#0ea5e9';
    return PROJECT_PALETTE[0];
  };

  const questDates = useMemo(() => {
    const set = new Set<string>();
    (quests ?? []).forEach((q) => {
      if (q.dueDate) set.add(q.dueDate.split('T')[0]);
    });
    return set;
  }, [quests]);

  const sections = useMemo(() => {
    const result: Record<Section, Record<string, QuestResponse[]>> = {
      tomorrow: {},
      thisWeek: {},
      nextWeek: {},
      later: {},
    };
    (quests ?? []).forEach((q) => {
      if (!q.dueDate) return;
      const dateStr = q.dueDate.split('T')[0];
      const date = parseISO(dateStr);
      const section = getSection(date, today);
      if (!result[section][dateStr]) result[section][dateStr] = [];
      result[section][dateStr].push(q);
    });
    return result;
  }, [quests, today]);

  const stats = useMemo(() => {
    const all = quests ?? [];
    const totalXp = all.reduce((s, q) => s + (q.totalXpReward ?? 0), 0);

    const byDate: Record<string, number> = {};
    all.forEach((q) => {
      const d = q.dueDate?.split('T')[0];
      if (d) byDate[d] = (byDate[d] ?? 0) + 1;
    });

    const busiestEntry = Object.entries(byDate).sort((a, b) => b[1] - a[1])[0];
    const busiestDay = busiestEntry ? parseISO(busiestEntry[0]) : null;

    let freeDays = 0;
    for (let i = 1; i <= 7; i++) {
      if (!byDate[format(addDays(today, i), 'yyyy-MM-dd')]) freeDays++;
    }

    return { total: all.length, totalXp, busiestDay, freeDays };
  }, [quests, today]);

  const projectBreakdown = useMemo(() => {
    const countById: Record<string, number> = {};
    (quests ?? []).forEach((q) => {
      if (!q.projectId) return;
      countById[q.projectId] = (countById[q.projectId] ?? 0) + 1;
    });

    const entries = Object.entries(countById)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    const maxCount = entries[0]?.[1] ?? 1;

    return entries.map(([id, count]) => {
      const project = projectMap.get(id);
      const color = projectColorMap.get(id) ?? PROJECT_PALETTE[0];
      return {
        id,
        name: project ? `${project.icon} ${project.name}` : '…',
        count,
        color,
        barWidth: (count / maxCount) * 100,
      };
    });
  }, [quests, projectMap, projectColorMap]);

  const subtitle = useMemo(() => {
    const total = quests?.length ?? 0;
    if (total === 0) return 'Nothing scheduled ahead';
    const hasNextWeek = Object.keys(sections.nextWeek).length > 0;
    const hasLater = Object.keys(sections.later).length > 0;
    const weeks = hasLater ? '2+' : hasNextWeek ? '2' : '1';
    return `${total} quest${total !== 1 ? 's' : ''} across the next ${weeks} week${weeks !== '1' ? 's' : ''}`;
  }, [quests, sections]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <div className="hidden lg:block lg:w-56 lg:shrink-0 space-y-4">
          <Skeleton className="h-52 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="hidden lg:block w-px bg-border" />
        <div className="flex-1 space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8 pb-10">
      <aside className="hidden lg:block lg:w-56 lg:shrink-0 space-y-6">
        <MiniCalendar
          viewMonth={viewMonth}
          onPrev={() => setViewMonth(subMonths(viewMonth, 1))}
          onNext={() => setViewMonth(addMonths(viewMonth, 1))}
          questDates={questDates}
        />

        <div className="space-y-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Next 7 days
          </p>
          <div className="space-y-2">
            <StatRow label="Quests" value={stats.total} />
            <StatRow
              label="XP planned"
              value={
                <span>
                  <span className="text-primary">{stats.totalXp.toLocaleString()}</span>
                  <span className="text-muted-foreground"> XP</span>
                </span>
              }
            />
            <StatRow
              label="Busiest day"
              value={stats.busiestDay ? format(stats.busiestDay, 'EEE MMM d') : '—'}
            />
            <StatRow label="Free days" value={stats.freeDays} />
          </div>
        </div>

        {projectBreakdown.length > 0 && (
          <div className="space-y-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              By project
            </p>
            <div className="space-y-2.5">
              {projectBreakdown.map(({ id, name, count, color, barWidth }) => (
                <div key={id} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="h-2 w-2 shrink-0 rounded-sm"
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate text-muted-foreground">{name}</span>
                    </div>
                    <span className="shrink-0 tabular-nums text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${barWidth}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      <div className="hidden lg:block w-px bg-border shrink-0" />

      <div className="flex-1 min-w-0 space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Upcoming</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {/* Compact stats strip — visible only below lg */}
        {(quests?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs lg:hidden">
            <span>
              <span className="text-muted-foreground">Quests </span>
              <span className="font-medium tabular-nums">{stats.total}</span>
            </span>
            <span>
              <span className="text-muted-foreground">XP planned </span>
              <span className="font-medium tabular-nums text-primary">
                {stats.totalXp.toLocaleString()}
              </span>
            </span>
            {stats.busiestDay && (
              <span>
                <span className="text-muted-foreground">Busiest </span>
                <span className="font-medium tabular-nums">
                  {format(stats.busiestDay, 'EEE MMM d')}
                </span>
              </span>
            )}
            <span>
              <span className="text-muted-foreground">Free days </span>
              <span className="font-medium tabular-nums">{stats.freeDays}</span>
            </span>
          </div>
        )}

        {(quests?.length ?? 0) === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            Nothing on the horizon — add a quest with a due date to see it here.
          </div>
        ) : (
          <div className="space-y-8">
            {SECTION_ORDER.map((section) => {
              const byDate = sections[section];
              const sortedDates = Object.keys(byDate).sort();
              if (sortedDates.length === 0) return null;

              return (
                <div key={section}>
                  <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {SECTION_LABELS[section]}
                  </p>
                  <div className="space-y-5">
                    {sortedDates.map((dateStr) => {
                      const date = parseISO(dateStr);
                      const dayQuests = byDate[dateStr]!;

                      return (
                        <div key={dateStr} className="flex gap-4">
                          <div className="w-9 shrink-0 pt-2.5 text-right">
                            <p className="text-[10px] font-medium uppercase leading-none text-muted-foreground">
                              {format(date, 'EEE')}
                            </p>
                            <p className="mt-1 text-xl font-semibold tabular-nums leading-none">
                              {format(date, 'd')}
                            </p>
                          </div>
                          <div className="flex-1 space-y-1.5">
                            {dayQuests.map((quest) => (
                              <UpcomingQuestRow
                                key={quest.id}
                                quest={quest}
                                accentColor={getAccentColor(quest)}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
