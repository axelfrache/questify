import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useQuests,
  useCompleteQuest,
  useDeleteQuest,
  useSkipQuest,
  useStatsOverview,
} from '@/hooks/use-api';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { type QuestResponse } from '@/lib/api';
import { QuestCard } from '@/components/QuestCard';
import { CreateQuestDialog } from '@/components/CreateQuestDialog';
import { QuestViewDialog } from '@/components/QuestViewDialog';
import confetti from 'canvas-confetti';
import { Flame } from 'lucide-react';

const fireConfettiFromElement = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  confetti({
    particleCount: 50,
    spread: 60,
    origin: {
      x: x / window.innerWidth,
      y: y / window.innerHeight,
    },
    colors: ['#4f46e5', '#818cf8', '#c7d2fe', '#a855f7', '#6366f1', '#e0e7ff'],
    startVelocity: 25,
    gravity: 0.8,
    scalar: 0.9,
    ticks: 100,
  });
};

export function TodayPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { data: quests, isLoading: isLoadingQuests } = useQuests(undefined, 'today');
  const { data: stats } = useStatsOverview();
  const completeQuestMutation = useCompleteQuest();
  const deleteQuestMutation = useDeleteQuest();
  const skipQuestMutation = useSkipQuest();

  const [viewingQuest, setViewingQuest] = useState<QuestResponse | null>(null);
  const [editingQuest, setEditingQuest] = useState<QuestResponse | null>(null);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return t('today.good_morning');
    if (h < 18) return t('today.good_afternoon');
    return t('today.good_evening');
  }, [t]);

  const formattedDate = useMemo(
    () =>
      new Date().toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    [i18n.language]
  );

  const handleComplete = (id: string, checkboxElement?: HTMLElement) => {
    if (checkboxElement) fireConfettiFromElement(checkboxElement);
    completeQuestMutation.mutate(id);
  };

  const handleDelete = deleteQuestMutation;

  const handleSkip = (id: string) => {
    skipQuestMutation.mutate(id);
  };

  if (isLoadingQuests) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  const plannedQuests =
    quests?.filter((q) => q.status !== 'COMPLETED' && q.status !== 'CANCELLED') || [];
  const completedQuests = quests?.filter((q) => q.status === 'COMPLETED').reverse() || [];

  const total = quests?.length || 0;
  const completed = completedQuests.length;
  const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const xpEarned = completedQuests.reduce((sum, q) => sum + (q.totalXpReward ?? 0), 0);
  const streak = stats?.currentStreak ?? 0;

  const firstName = user?.username
    ? user.username.charAt(0).toUpperCase() + user.username.slice(1)
    : '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('today.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {greeting}
          {firstName ? `, ${firstName}` : ''} — {formattedDate}
        </p>
      </div>

      {/* Daily progress card */}
      {total > 0 ? (
        <div className="relative overflow-hidden rounded-lg border bg-card p-5">
          {/* Background flourish */}
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full"
            style={{
              background:
                'radial-gradient(circle, oklch(0.56 0.18 275 / 0.08) 0%, transparent 65%)',
            }}
          />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                {t('today.daily_progress')}
              </p>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="font-mono text-4xl font-medium tracking-tight text-foreground">
                  {completed}
                </span>
                <span className="text-base text-muted-foreground">
                  {t('today.quests_count', { total })}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('today.completion_line', { percent: completionPercent, xp: xpEarned })}
              </p>
            </div>

            {streak > 0 && (
              <div
                className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
                style={{
                  background: 'oklch(0.96 0.04 50)',
                  borderColor: 'oklch(0.88 0.08 50)',
                  color: 'oklch(0.55 0.15 40)',
                }}
              >
                <Flame className="h-3 w-3" />
                <span className="font-mono">{t('today.streak', { count: streak })}</span>
              </div>
            )}
          </div>

          <div className="relative mt-4">
            <Progress value={Math.min(completionPercent, 100)} className="h-1.5" />
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-base font-medium text-muted-foreground">{t('today.nothing_today')}</p>
          <p className="mt-1 text-sm text-muted-foreground/70">{t('today.nothing_today_hint')}</p>
        </div>
      )}

      {/* Active quests */}
      {plannedQuests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{t('today.todays_quests')}</h2>
            <span className="font-mono text-xs text-muted-foreground">
              {t('today.items', { count: plannedQuests.length })}
            </span>
          </div>
          <div className="space-y-1.5">
            {plannedQuests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onComplete={handleComplete}
                onView={setViewingQuest}
                onEdit={setEditingQuest}
                onDelete={handleDelete}
                onSkip={handleSkip}
                isPending={completeQuestMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed quests */}
      {completedQuests.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">{t('today.completed')}</h2>
          <div className="space-y-1.5">
            {completedQuests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onComplete={handleComplete}
                onView={setViewingQuest}
                onEdit={setEditingQuest}
                onDelete={handleDelete}
                isPending={completeQuestMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

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
