import { useState } from 'react';
import { useQuests, useDeleteQuest } from '@/hooks/use-api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreVertical, Edit, Trash, Repeat } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
            <Card key={habit.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Repeat className="w-4 h-4" />
                  <span className="text-xs">{habit.recurrenceInterval}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{habit.title}</p>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-4">
                  <div className="flex items-center">
                    {habit.category && <span className="mr-3">{habit.category.icon}</span>}
                    <span>+{habit.totalXpReward} XP</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingHabit(habit)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(habit.id)}
                        className="text-destructive"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
