import { useState } from 'react';
import { useQuests, useCategories, useCompleteQuest, useDeleteQuest } from '@/hooks/use-api';
import { useInboxFilters } from '@/hooks/useInboxFilters';
import { useInboxSort } from '@/hooks/useInboxSort';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { InboxToolbar } from '@/components/InboxToolbar';
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
  const {
    data: quests,
    isLoading: isLoadingQuests,
    error: errorQuests,
  } = useQuests(undefined, 'inbox');
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const completeQuestMutation = useCompleteQuest();
  const deleteQuestMutation = useDeleteQuest();

  const [editingQuest, setEditingQuest] = useState<QuestResponse | null>(null);
  const [parentQuest, setParentQuest] = useState<QuestResponse | null>(null);

  const {
    filters,
    setSearch,
    toggleDifficulty,
    toggleRegion,
    toggleRecurrence,
    setStructure,
    clearAllFilters,
    filterQuests,
    activeFilterCount,
    hasActiveFilters,
    getActiveFilterLabels,
    removeFilter,
  } = useInboxFilters(categories || []);

  const { sortOption, setSortOption, sortQuests, sortLabels } = useInboxSort();

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

  const handleAddSubquest = (quest: QuestResponse) => {
    setParentQuest(quest);
  };

  const pendingQuests = quests?.filter((q) => q.status === 'PENDING') || [];
  const filteredQuests = filterQuests(pendingQuests);
  const sortedQuests = sortQuests(filteredQuests);

  if (isLoadingQuests || isLoadingCategories) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inbox</h1>
        <p className="text-muted-foreground">Quest Board</p>
      </div>

      <InboxToolbar
        filters={filters}
        categories={categories || []}
        onSearchChange={setSearch}
        onToggleDifficulty={toggleDifficulty}
        onToggleRegion={toggleRegion}
        onToggleRecurrence={toggleRecurrence}
        onSetStructure={setStructure}
        onClearAllFilters={clearAllFilters}
        onRemoveFilter={removeFilter}
        activeFilterCount={activeFilterCount}
        activeFilterLabels={getActiveFilterLabels()}
        sortOption={sortOption}
        sortLabels={sortLabels}
        onSortChange={setSortOption}
      />

      {errorQuests && (
        <Alert variant="destructive">
          <AlertDescription>Failed to load quests</AlertDescription>
        </Alert>
      )}

      {sortedQuests.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          {hasActiveFilters
            ? 'No quests match your search or filters.'
            : 'No quests found. Start your journey by adding a new quest!'}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedQuests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onComplete={handleComplete}
              onEdit={setEditingQuest}
              onDelete={handleDelete}
              onAddSubquest={handleAddSubquest}
              isPending={completeQuestMutation.isPending}
              showInlineSubquests
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
                recurrenceDays: editingQuest.recurrenceDays,
                baseXpReward: editingQuest.baseXpReward,
              }
            : undefined
        }
      />

      <CreateQuestDialog
        open={!!parentQuest}
        onOpenChange={(open) => !open && setParentQuest(null)}
        parentId={parentQuest?.templateId}
        parentTitle={parentQuest?.title}
        parentRecurrence={parentQuest?.recurrenceInterval}
      />
    </div>
  );
}
