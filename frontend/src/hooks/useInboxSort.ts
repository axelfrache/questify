import { useState, useCallback, useEffect } from 'react';
import type { QuestResponse } from '@/lib/api';

export type SortOption = 'dueDate' | 'createdAt' | 'alphabetical' | 'xpReward';

const SORT_STORAGE_KEY = 'questify-inbox-sort';

const sortLabels: Record<SortOption, string> = {
  dueDate: 'Due date',
  createdAt: 'Recently created',
  alphabetical: 'Alphabetical',
  xpReward: 'XP reward',
};

export function useInboxSort() {
  const [sortOption, setSortOption] = useState<SortOption>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SORT_STORAGE_KEY);
      if (stored && isValidSortOption(stored)) {
        return stored as SortOption;
      }
    }
    return 'dueDate';
  });

  useEffect(() => {
    localStorage.setItem(SORT_STORAGE_KEY, sortOption);
  }, [sortOption]);

  const sortQuests = useCallback(
    (quests: QuestResponse[]): QuestResponse[] => {
      const sorted = [...quests];

      sorted.sort((a, b) => {
        switch (sortOption) {
          case 'dueDate': {
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          }
          case 'createdAt': {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          case 'alphabetical': {
            return a.title.localeCompare(b.title);
          }
          case 'xpReward': {
            return b.totalXpReward - a.totalXpReward;
          }
          default:
            return 0;
        }
      });

      return sorted;
    },
    [sortOption]
  );

  return {
    sortOption,
    setSortOption,
    sortQuests,
    sortLabels,
  };
}

function isValidSortOption(value: string): value is SortOption {
  return ['dueDate', 'createdAt', 'alphabetical', 'xpReward'].includes(value);
}
