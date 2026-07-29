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

  const plannedByDate = new Map<string, number>();
  const completedByDate = new Map<string, number>();

  uniqueQuests.forEach((quest) => {
    if (quest.status === 'CANCELLED') return;

    const dueKey = getQuestDateKey(quest.dueDate);
    if (dueKey) {
      plannedByDate.set(dueKey, (plannedByDate.get(dueKey) ?? 0) + 1);
    }

    if (quest.status === 'COMPLETED') {
      const completedKey = getQuestDateKey(quest.completedAt);
      if (completedKey) {
        completedByDate.set(completedKey, (completedByDate.get(completedKey) ?? 0) + 1);
      }
    }
  });

  const allKeys = new Set([...plannedByDate.keys(), ...completedByDate.keys()]);
  const dailyCompletion = new Map<string, DailyCompletionSnapshot>();

  allKeys.forEach((key) => {
    const plannedQuests = plannedByDate.get(key) ?? 0;
    const completedQuests = completedByDate.get(key) ?? 0;
    const completionRate =
      plannedQuests > 0
        ? Math.round((completedQuests / plannedQuests) * 100)
        : completedQuests > 0
          ? 100
          : 0;
    dailyCompletion.set(key, { plannedQuests, completedQuests, completionRate });
  });

  return Object.fromEntries(dailyCompletion);
}
