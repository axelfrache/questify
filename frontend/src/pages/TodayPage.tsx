import { useState } from 'react';
import { useDailyStats, useQuests, useCompleteQuest, useDeleteQuest } from '@/hooks/use-api';
import { Skeleton } from '@/components/ui/skeleton';
import { type QuestResponse } from '@/lib/api';
import { QuestCard } from '@/components/QuestCard';
import { CreateQuestDialog } from '@/components/CreateQuestDialog';
import confetti from 'canvas-confetti';

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
  const { data: stats, isLoading: isLoadingStats } = useDailyStats();
  const { data: quests, isLoading: isLoadingQuests } = useQuests(undefined, 'today');
  const completeQuestMutation = useCompleteQuest();
  const deleteQuestMutation = useDeleteQuest();

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

  if (isLoadingStats || isLoadingQuests) {
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

  const xpGoal = 100;
  const currentXp = stats?.xpEarned || 0;
  const progressPercentage = Math.min((currentXp / xpGoal) * 100, 100);

  return (
    <div className="space-y-8">
      {/* Daily Progress Header */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Daily Goal</span>
          <span>
            {currentXp} / {xpGoal} XP
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-right">
          {stats?.questsCompleted || 0} quests completed today
        </p>
      </div>

      {/* Planned Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Planned for Today</h2>
        {plannedQuests.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            No quests scheduled for today. Check your inbox or add a new one!
          </div>
        ) : (
          <div className="space-y-3">
            {plannedQuests.map((quest) => (
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
        )}
      </div>

      {/* Completed Section */}
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
                baseXpReward: editingQuest.baseXpReward,
              }
            : undefined
        }
      />
    </div>
  );
}
