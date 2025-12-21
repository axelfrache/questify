import { useState } from 'react';
import { useDailyStats, useQuests, useCompleteQuest, useDeleteQuest } from '@/hooks/use-api';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { type QuestResponse } from '@/lib/api';
import { MoreVertical, Edit, Trash } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateQuestDialog } from '@/components/CreateQuestDialog';

export function TodayPage() {
  const { data: stats, isLoading: isLoadingStats } = useDailyStats();
  const { data: quests, isLoading: isLoadingQuests } = useQuests(undefined, 'today');
  const completeQuestMutation = useCompleteQuest();
  const deleteQuestMutation = useDeleteQuest();

  const [editingQuest, setEditingQuest] = useState<QuestResponse | null>(null);

  const handleComplete = (id: string, currentStatus: string) => {
    if (currentStatus === 'COMPLETED') return;
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
  const completedQuests = quests?.filter((q) => q.status === 'COMPLETED') || [];

  // Calculate XP progress (mock goal of 100 XP for now)
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
              <QuestItem
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
              <QuestItem
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

function QuestItem({
  quest,
  onComplete,
  onEdit,
  onDelete,
  isPending,
}: {
  quest: QuestResponse;
  onComplete: (id: string, status: string) => void;
  onEdit: (quest: QuestResponse) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}) {
  return (
    <Card className={quest.status === 'COMPLETED' ? 'opacity-60' : ''}>
      <CardContent className="p-4 flex items-center gap-4">
        <Checkbox
          checked={quest.status === 'COMPLETED'}
          onCheckedChange={() => onComplete(quest.id, quest.status)}
          disabled={quest.status === 'COMPLETED' || isPending}
        />
        <div className="flex-1">
          <p
            className={`font-medium ${quest.status === 'COMPLETED' ? 'line-through text-muted-foreground' : ''}`}
          >
            {quest.title}
          </p>
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-4">
          <div className="flex items-center">
            {quest.category && <span className="mr-3">{quest.category.icon}</span>}
            <span>+{quest.totalXpReward} XP</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(quest)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(quest.id)} className="text-destructive">
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
