import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useProjectsList,
  useQuests,
  useCompleteQuest,
  useDeleteQuest,
  useSkipQuest,
} from '@/hooks/use-api';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDateLocale } from '@/hooks/useDateLocale';
import { cn } from '@/lib/utils';
import type { QuestResponse, ProjectSummaryResponse } from '@/lib/api';
import { QuestCard } from '@/components/QuestCard';
import { QuestViewDialog } from '@/components/QuestViewDialog';
import { CreateQuestDialog } from '@/components/CreateQuestDialog';
import { fireConfettiFromElement } from '@/lib/celebration';

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
  questCountByDate,
}: {
  viewMonth: Date;
  onPrev: () => void;
  onNext: () => void;
  questDates: Set<string>;
  questCountByDate: Map<string, number>;
}) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold">
          {format(viewMonth, 'MMMM yyyy', { locale: dateLocale })}
        </span>
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
        {days.slice(0, 7).map((d) => (
          <div
            key={d.getDay()}
            className="text-center text-[10px] font-medium text-muted-foreground/60 py-1"
          >
            {format(d, 'EEEEE', { locale: dateLocale })}
          </div>
        ))}
      </div>

      <TooltipProvider delayDuration={150}>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const hasQuests = questDates.has(dateStr) && isSameMonth(day, viewMonth);
            const isCurrentDay = isToday(day);
            const inMonth = isSameMonth(day, viewMonth);
            const count = questCountByDate.get(dateStr) ?? 0;

            const cell = (
              <div className="flex flex-col items-center py-0.5">
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

            if (!hasQuests) return <div key={dateStr}>{cell}</div>;

            return (
              <Tooltip key={dateStr}>
                <TooltipTrigger asChild>
                  <button type="button" className="cursor-default">
                    {cell}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">{t('upcoming.calendar_day', { count })}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
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

interface DayLoad {
  date: Date;
  dateStr: string;
  count: number;
  quests: QuestResponse[];
}

const LOAD_WARN_THRESHOLD = 3;
const LOAD_OVER_THRESHOLD = 6;

function LoadStrip({
  days,
  selectedDay,
  onSelectDay,
}: {
  days: DayLoad[];
  selectedDay: string | null;
  onSelectDay: (dateStr: string) => void;
}) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const max = Math.max(4, ...days.map((d) => d.count));

  return (
    <div className="space-y-2">
      <TooltipProvider delayDuration={150}>
        <div className="grid grid-cols-7 gap-1 rounded-lg border border-border bg-card p-2">
          {days.map((day) => {
            const isSelected = selectedDay === day.dateStr;
            const level =
              day.count >= LOAD_OVER_THRESHOLD
                ? 'over'
                : day.count >= LOAD_WARN_THRESHOLD
                  ? 'busy'
                  : 'normal';
            const barColor =
              level === 'over'
                ? 'bg-destructive'
                : level === 'busy'
                  ? 'bg-quest-hard'
                  : 'bg-primary';
            const countColor =
              level === 'over'
                ? 'text-destructive'
                : level === 'busy'
                  ? 'text-quest-hard'
                  : 'text-muted-foreground';
            const barHeight = day.count ? Math.max(4, Math.round((day.count / max) * 32)) : 0;

            return (
              <Tooltip key={day.dateStr}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onSelectDay(day.dateStr)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-md py-2 transition-colors',
                      isSelected ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-muted/60'
                    )}
                  >
                    <span className="text-[10px] font-medium uppercase text-muted-foreground">
                      {format(day.date, 'EEE', { locale: dateLocale })}
                    </span>
                    <span className="text-sm font-semibold tabular-nums">
                      {format(day.date, 'd')}
                    </span>
                    <span className="flex h-8 w-2.5 items-end justify-center rounded-full bg-muted/70">
                      {barHeight > 0 && (
                        <span
                          className={cn('block w-full rounded-full', barColor)}
                          style={{ height: barHeight }}
                        />
                      )}
                    </span>
                    <span className={cn('font-mono text-[10px] leading-none', countColor)}>
                      {day.count || ''}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[220px]">
                  <p className="font-medium">
                    {format(day.date, 'EEEE d MMMM', { locale: dateLocale })}
                  </p>
                  {day.quests.length === 0 ? (
                    <p className="text-background/70">{t('upcoming.day_empty')}</p>
                  ) : (
                    <ul className="mt-1 space-y-0.5">
                      {day.quests.slice(0, 4).map((q) => (
                        <li key={q.id} className="truncate">
                          {q.title}
                        </li>
                      ))}
                      {day.quests.length > 4 && (
                        <li className="text-background/70">+{day.quests.length - 4}</li>
                      )}
                    </ul>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-primary" />
          {t('upcoming.load_legend_normal')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-quest-hard" />
          {t('upcoming.load_legend_busy')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-destructive" />
          {t('upcoming.load_legend_over')}
        </span>
      </div>
    </div>
  );
}

export function UpcomingPage() {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const { data: quests, isLoading } = useQuests(undefined, 'upcoming');
  const { data: projects } = useProjectsList('', 'name', false);
  const completeQuestMutation = useCompleteQuest();
  const deleteQuest = useDeleteQuest();
  const skipQuestMutation = useSkipQuest();
  const [viewMonth, setViewMonth] = useState(() => new Date());
  const [viewingQuest, setViewingQuest] = useState<QuestResponse | null>(null);
  const [editingQuest, setEditingQuest] = useState<QuestResponse | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const handleComplete = (id: string, checkboxElement?: HTMLElement) => {
    if (checkboxElement) fireConfettiFromElement(checkboxElement);
    completeQuestMutation.mutate(id);
  };

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

  const questDates = useMemo(() => {
    const set = new Set<string>();
    (quests ?? []).forEach((q) => {
      if (q.dueDate) set.add(q.dueDate.split('T')[0]);
    });
    return set;
  }, [quests]);

  const questCountByDate = useMemo(() => {
    const map = new Map<string, number>();
    (quests ?? []).forEach((q) => {
      if (!q.dueDate) return;
      const dateStr = q.dueDate.split('T')[0];
      map.set(dateStr, (map.get(dateStr) ?? 0) + 1);
    });
    return map;
  }, [quests]);

  const loadDays = useMemo<DayLoad[]>(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(today, i + 1);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayQuests = (quests ?? []).filter((q) => q.dueDate?.split('T')[0] === dateStr);
      const count = dayQuests.reduce(
        (s, q) =>
          s + (q.subquestCount > 0 ? Math.max(1, q.subquestCount - q.completedSubquestCount) : 1),
        0
      );
      return { date, dateStr, count, quests: dayQuests };
    });
  }, [quests, today]);

  const visibleQuests = useMemo(() => {
    if (!selectedDay) return quests ?? [];
    return (quests ?? []).filter((q) => q.dueDate?.split('T')[0] === selectedDay);
  }, [quests, selectedDay]);

  const sections = useMemo(() => {
    const result: Record<Section, Record<string, QuestResponse[]>> = {
      tomorrow: {},
      thisWeek: {},
      nextWeek: {},
      later: {},
    };
    visibleQuests.forEach((q) => {
      if (!q.dueDate) return;
      const dateStr = q.dueDate.split('T')[0];
      const date = parseISO(dateStr);
      const section = getSection(date, today);
      if (!result[section][dateStr]) result[section][dateStr] = [];
      result[section][dateStr].push(q);
    });
    return result;
  }, [visibleQuests, today]);

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
    if (total === 0) return t('upcoming.subtitle_empty');
    const dueSections = (quests ?? [])
      .filter((q) => q.dueDate)
      .map((q) => getSection(parseISO(q.dueDate!.split('T')[0]), today));
    const hasNextWeek = dueSections.includes('nextWeek');
    const hasLater = dueSections.includes('later');
    const weeks = hasLater ? '2+' : hasNextWeek ? '2' : '1';
    const weeksNum = parseInt(weeks) || 1;
    return weeksNum > 1
      ? t('upcoming.subtitle_plural', { total, weeks })
      : t('upcoming.subtitle', { total, weeks });
  }, [quests, today, t]);

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
      <aside className="hidden lg:block lg:w-56 lg:shrink-0 space-y-6 sticky top-0 self-start">
        <MiniCalendar
          viewMonth={viewMonth}
          onPrev={() => setViewMonth(subMonths(viewMonth, 1))}
          onNext={() => setViewMonth(addMonths(viewMonth, 1))}
          questDates={questDates}
          questCountByDate={questCountByDate}
        />

        <div className="space-y-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {t('upcoming.next_7')}
          </p>
          <div className="space-y-2">
            <StatRow label={t('upcoming.quests')} value={stats.total} />
            <StatRow
              label={t('upcoming.xp_planned')}
              value={
                <span>
                  <span className="text-primary">{stats.totalXp.toLocaleString()}</span>
                  <span className="text-muted-foreground"> XP</span>
                </span>
              }
            />
            <StatRow
              label={t('upcoming.busiest_day')}
              value={
                stats.busiestDay
                  ? format(stats.busiestDay, 'EEE MMM d', { locale: dateLocale })
                  : '—'
              }
            />
            <StatRow label={t('upcoming.free_days')} value={stats.freeDays} />
          </div>
        </div>

        {projectBreakdown.length > 0 && (
          <div className="space-y-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {t('upcoming.by_project')}
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
          <h1 className="text-2xl font-bold tracking-tight">{t('upcoming.title')}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {(quests?.length ?? 0) > 0 && (
          <LoadStrip
            days={loadDays}
            selectedDay={selectedDay}
            onSelectDay={(dateStr) => setSelectedDay((prev) => (prev === dateStr ? null : dateStr))}
          />
        )}

        {/* Compact stats strip — visible only below lg */}
        {(quests?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs lg:hidden">
            <span>
              <span className="text-muted-foreground">{t('upcoming.quests')} </span>
              <span className="font-medium tabular-nums">{stats.total}</span>
            </span>
            <span>
              <span className="text-muted-foreground">{t('upcoming.xp_planned')} </span>
              <span className="font-medium tabular-nums text-primary">
                {stats.totalXp.toLocaleString()}
              </span>
            </span>
            {stats.busiestDay && (
              <span>
                <span className="text-muted-foreground">{t('upcoming.busiest_day')} </span>
                <span className="font-medium tabular-nums">
                  {format(stats.busiestDay, 'EEE MMM d', { locale: dateLocale })}
                </span>
              </span>
            )}
            <span>
              <span className="text-muted-foreground">{t('upcoming.free_days')} </span>
              <span className="font-medium tabular-nums">{stats.freeDays}</span>
            </span>
          </div>
        )}

        {(quests?.length ?? 0) === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            {t('upcoming.empty')}
          </div>
        ) : (
          <div className="space-y-6">
            {selectedDay && (
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {t('upcoming.filtered_day', {
                    date: format(parseISO(selectedDay), 'EEEE d MMMM', { locale: dateLocale }),
                  })}
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {t('upcoming.clear_filter')}
                </button>
              </div>
            )}

            {selectedDay && visibleQuests.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                {t('upcoming.no_quests_day')}
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
                        {t('upcoming.sections.' + section)}
                      </p>
                      <div className="space-y-5">
                        {sortedDates.map((dateStr) => {
                          const date = parseISO(dateStr);
                          const dayQuests = byDate[dateStr]!;

                          return (
                            <div key={dateStr} className="flex gap-4">
                              <div className="w-9 shrink-0 pt-2.5 text-right">
                                <p className="text-[10px] font-medium uppercase leading-none text-muted-foreground">
                                  {format(date, 'EEE', { locale: dateLocale })}
                                </p>
                                <p className="mt-1 text-xl font-semibold tabular-nums leading-none">
                                  {format(date, 'd')}
                                </p>
                              </div>
                              <div className="flex-1 space-y-1.5">
                                {dayQuests.map((quest) => (
                                  <QuestCard
                                    key={quest.id}
                                    quest={quest}
                                    onComplete={handleComplete}
                                    onView={setViewingQuest}
                                    onEdit={setEditingQuest}
                                    onDelete={deleteQuest}
                                    onSkip={(id) => skipQuestMutation.mutate(id)}
                                    isPending={completeQuestMutation.isPending}
                                    showInlineSubquests
                                    density="comfort"
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
        )}
      </div>

      <QuestViewDialog
        quest={viewingQuest}
        open={!!viewingQuest}
        onOpenChange={(open) => !open && setViewingQuest(null)}
        onEdit={setEditingQuest}
        onComplete={handleComplete}
      />

      <CreateQuestDialog
        open={!!editingQuest}
        onOpenChange={(open) => !open && setEditingQuest(null)}
        questToEdit={
          editingQuest
            ? {
                id: editingQuest.id,
                title: editingQuest.title,
                description: editingQuest.description,
                difficulty: editingQuest.difficulty,
                categoryId: editingQuest.category?.id,
                projectId: editingQuest.projectId,
                dueDate: editingQuest.dueDate,
                recurrenceInterval: editingQuest.recurrenceInterval,
                recurrenceDays: editingQuest.recurrenceDays,
                baseXpReward: editingQuest.baseXpReward,
              }
            : undefined
        }
      />
    </div>
  );
}
