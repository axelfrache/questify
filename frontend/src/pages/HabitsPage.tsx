import { useState } from 'react';
import { useQuests, useDeleteQuest } from '@/hooks/use-api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit2, Trash2, Repeat } from 'lucide-react';
import { CreateQuestDialog } from '@/components/CreateQuestDialog';
import type { QuestResponse } from '@/lib/api';

export function HabitsPage() {
  const { data: habits, isLoading } = useQuests(undefined, 'recurring');
  const deleteQuest = useDeleteQuest();
  const [editingHabit, setEditingHabit] = useState<QuestResponse | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
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
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No habits set up yet. Create a recurring quest to see it here!
        </div>
      ) : (
        <div className="grid gap-4">
          {habits.map((habit) => (
            <Card key={habit.id}>
              <CardContent className="p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                    style={{
                      backgroundColor: habit.category?.color
                        ? `${habit.category.color}20`
                        : '#f3f4f6',
                      color: habit.category?.color || '#6b7280',
                    }}
                  >
                    {habit.category?.icon || '📝'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{habit.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Repeat className="w-3 h-3" />
                      <span>{habit.recurrenceInterval}</span>
                      <span>•</span>
                      <span>{habit.difficulty}</span>
                      <span>•</span>
                      <span>{habit.baseXpReward} XP</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setEditingHabit(habit)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive/90"
                    onClick={() => {
                      if (
                        confirm(
                          'Are you sure you want to delete this habit? Future occurrences will be stopped.'
                        )
                      ) {
                        deleteQuest.mutate(habit.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
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
