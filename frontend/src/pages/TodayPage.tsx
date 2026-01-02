import { useState } from 'react';
import {
  useQuests,
  useCompleteQuest,
  useDeleteQuest,
  useSkipQuest,
  useCompletionRate,
} from '@/hooks/use-api';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { type QuestResponse } from '@/lib/api';
import { QuestCard } from '@/components/QuestCard';
import { CreateQuestDialog } from '@/components/CreateQuestDialog';
import confetti from 'canvas-confetti';
import { CheckCircle2, Sun } from 'lucide-react';

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
    colors: ['#22c55e', '#16a34a', '#4ade80', '#86efac', '#fbbf24', '#f59e0b'],
    startVelocity: 25,
    gravity: 0.8,
    scalar: 0.9,
    ticks: 100,
  });
};

export function TodayPage() {
  const { data: completionRate, isLoading: isLoadingCompletion } = useCompletionRate();
  const { data: quests, isLoading: isLoadingQuests } = useQuests(undefined, 'today');
  const completeQuestMutation = useCompleteQuest();
  const deleteQuestMutation = useDeleteQuest();
  const skipQuestMutation = useSkipQuest();

  const [editingQuest, setEditingQuest] = useState<QuestResponse | null>(null);

  const handleComplete = (id: string, checkboxElement?: HTMLElement) => {
    if (checkboxElement) {
      fireConfettiFromElement(checkboxElement);
    }
    completeQuestMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this quest?')) {
      deleteQuestMutation.mutate(id);
    }
  };

  const handleSkip = (id: string) => {
    skipQuestMutation.mutate(id);
  };

  if (isLoadingCompletion || isLoadingQuests) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const plannedQuests =
    quests?.filter((q) => q.status !== 'COMPLETED' && q.status !== 'CANCELLED') || [];
  const completedQuests = quests?.filter((q) => q.status === 'COMPLETED').reverse() || [];

  const planned = completionRate?.plannedQuests || 0;
  const completed = completionRate?.completedQuests || 0;
  const completionPercent = completionRate?.completionRate || 0;

  const hasPlannedQuests = planned > 0;

  const getCompletionColor = (rate: number) => {
    if (rate >= 100) return 'text-green-500';
    if (rate >= 75) return 'text-emerald-500';
    if (rate >= 50) return 'text-primary';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-8">
      {/* Completion tracker - only show when there are planned quests */}
      {hasPlannedQuests ? (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Daily Completion</span>
            </div>
            <span className={`text-2xl font-bold ${getCompletionColor(completionPercent)}`}>
              {completionPercent}%
            </span>
          </div>
          <Progress value={Math.min(completionPercent, 100)} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {completed} of {planned} quests completed
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-card/50 p-6 text-center">
          <Sun className="h-10 w-10 text-amber-500/60 mx-auto mb-3" />
          <p className="text-lg font-medium text-muted-foreground">Nothing required today</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Enjoy your day, or check the inbox for optional tasks.
          </p>
        </div>
      )}

      {/* Active quests for today */}
      {plannedQuests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Today's Quests</h2>
          <div className="space-y-3">
            {plannedQuests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onComplete={handleComplete}
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
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">Completed</h2>
          <div className="space-y-3">
            {completedQuests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onComplete={handleComplete}
                onEdit={setEditingQuest}
                onDelete={handleDelete}
                isPending={completeQuestMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

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
