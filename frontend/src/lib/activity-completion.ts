import type { QuestResponse } from '@/lib/api';

export interface DailyCompletionSnapshot {
  plannedQuests: number;
  completedQuests: number;
  completionRate: number;
}

export function getUtcDateKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

export function getQuestDateKey(dueDate?: string) {
  return dueDate ? dueDate.slice(0, 10) : null;
}

export function buildDailyCompletionMap(quests: QuestResponse[]) {
  const uniqueQuests = new Map<string, QuestResponse>();

  quests.forEach((quest) => {
    uniqueQuests.set(quest.id, quest);
  });

  const dailyCompletion = new Map<string, DailyCompletionSnapshot>();

  uniqueQuests.forEach((quest) => {
    const dateKey = getQuestDateKey(quest.dueDate);
    if (!dateKey || quest.status === 'CANCELLED') return;

    const current = dailyCompletion.get(dateKey) ?? {
      plannedQuests: 0,
      completedQuests: 0,
      completionRate: 0,
    };

    current.plannedQuests += 1;
    if (quest.status === 'COMPLETED') {
      current.completedQuests += 1;
    }

    current.completionRate =
      current.plannedQuests > 0
        ? Math.round((current.completedQuests / current.plannedQuests) * 100)
        : 0;

    dailyCompletion.set(dateKey, current);
  });

  return Object.fromEntries(dailyCompletion);
}
