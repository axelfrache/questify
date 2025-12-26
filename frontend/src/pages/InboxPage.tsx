import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuests, useCategories, useCompleteQuest, useDeleteQuest } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { X } from 'lucide-react';
import { QuestCard } from '@/components/QuestCard';
import { CreateQuestDialog } from '@/components/CreateQuestDialog';
import { type QuestResponse } from '@/lib/api';
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

export function InboxPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryId = searchParams.get('category');

  const {
    data: quests,
    isLoading: isLoadingQuests,
    error: errorQuests,
  } = useQuests(undefined, 'inbox');
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
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

  const clearFilter = () => {
    setSearchParams({});
  };

  const pendingQuests = quests?.filter((q) => q.status === 'PENDING') || [];

  const filteredQuests = categoryId
    ? pendingQuests.filter((q) => q.category?.id === categoryId)
    : pendingQuests;

  const currentCategory = categoryId ? categories?.find((c) => c.id === categoryId) : null;

  if (isLoadingQuests || isLoadingCategories) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inbox</h1>
          <p className="text-muted-foreground">
            {currentCategory ? `Quests in ${currentCategory.name}` : 'Quest Board'}
          </p>
        </div>
        {currentCategory && (
          <Button variant="outline" size="sm" onClick={clearFilter} className="gap-2">
            <X className="h-4 w-4" />
            Clear Filter
          </Button>
        )}
      </div>

      {errorQuests && (
        <Alert variant="destructive">
          <AlertDescription>Failed to load quests</AlertDescription>
        </Alert>
      )}

      {filteredQuests.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          {categoryId
            ? `No quests found in ${currentCategory?.name || 'this category'}.`
            : 'No quests found. Start your journey by adding a new quest!'}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuests.map((quest) => (
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
