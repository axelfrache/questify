import { useState } from 'react';
import { useQuests, useDeleteQuest } from '@/hooks/use-api';
import { Skeleton } from '@/components/ui/skeleton';
import { QuestCard } from '@/components/QuestCard';
import { CreateQuestDialog } from '@/components/CreateQuestDialog';
import type { QuestResponse } from '@/lib/api';

export function HabitsPage() {
  const { data: habits, isLoading } = useQuests(undefined, 'recurring');
  const deleteQuest = useDeleteQuest();
  const [editingHabit, setEditingHabit] = useState<QuestResponse | null>(null);

  const handleDelete = (id: string) => {
    if (
      confirm('Are you sure you want to delete this habit? Future occurrences will be stopped.')
    ) {
      deleteQuest.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Habits</h1>
        <p className="text-muted-foreground">Manage your recurring quests.</p>
      </div>

      {!habits || habits.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No habits set up yet. Create a recurring quest to see it here!
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => (
            <QuestCard
              key={habit.id}
              quest={habit}
              onEdit={setEditingHabit}
              onDelete={handleDelete}
              hideCheckbox
            />
          ))}
        </div>
      )}

      {editingHabit && (
        <CreateQuestDialog
          open={!!editingHabit}
          onOpenChange={(open) => !open && setEditingHabit(null)}
          questToEdit={editingHabit}
        />
      )}
    </div>
  );
}
