import { useMemo, useState } from 'react';
import { useQuests, useDeleteQuest, useHistory } from '@/hooks/use-api';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { QuestCard } from '@/components/QuestCard';
import { CreateQuestDialog } from '@/components/CreateQuestDialog';
import { HabitConsistency } from '@/components/HabitConsistency';
import { groupCompletionsByQuest } from '@/lib/habit-stats';
import type { QuestResponse } from '@/lib/api';

const NO_COMPLETIONS: Date[] = [];

export function HabitsPage() {
  const { t } = useTranslation();
  const { data: habits, isLoading } = useQuests(undefined, 'recurring');
  const { data: history } = useHistory(0, 300);
  const deleteQuest = useDeleteQuest(t('habits.deleted'));
  const [editingHabit, setEditingHabit] = useState<QuestResponse | null>(null);

  const completionsByQuest = useMemo(
    () => groupCompletionsByQuest(history?.content ?? []),
    [history]
  );

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
        <h1 className="text-2xl font-bold tracking-tight">{t('habits.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('habits.description')}</p>
      </div>

      {!habits || habits.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          {t('habits.empty')}
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => (
            <QuestCard
              key={habit.id}
              quest={habit}
              onEdit={setEditingHabit}
              onDelete={deleteQuest}
              hideCheckbox
              footer={
                <HabitConsistency
                  completions={completionsByQuest.get(habit.id) ?? NO_COMPLETIONS}
                  recurrence={habit.recurrenceInterval}
                  color={habit.category?.color}
                />
              }
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
