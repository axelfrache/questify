import { useState } from 'react';
import { useQuests, useDeleteQuest } from '@/hooks/use-api';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { QuestCard } from '@/components/QuestCard';
import { CreateQuestDialog } from '@/components/CreateQuestDialog';
import type { QuestResponse } from '@/lib/api';

export function HabitsPage() {
  const { t } = useTranslation();
  const { data: habits, isLoading } = useQuests(undefined, 'recurring');
  const deleteQuest = useDeleteQuest(t('habits.deleted'));
  const [editingHabit, setEditingHabit] = useState<QuestResponse | null>(null);

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
