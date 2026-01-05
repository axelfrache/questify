import { useState, useCallback, useMemo } from 'react';
import type { QuestResponse, CategoryResponse } from '@/lib/api';

export type DifficultyFilter = 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC';
export type RecurrenceFilter = 'one-off' | 'daily' | 'weekly' | 'habit';
export type StructureFilter = 'has-subquests' | 'is-subquest' | 'parent-only';

export interface InboxFilters {
  search: string;
  difficulties: DifficultyFilter[];
  regions: string[];
  recurrence: RecurrenceFilter[];
  structure: StructureFilter | null;
}

const defaultFilters: InboxFilters = {
  search: '',
  difficulties: [],
  regions: [],
  recurrence: [],
  structure: null,
};

export function useInboxFilters(categories: CategoryResponse[] = []) {
  const [filters, setFilters] = useState<InboxFilters>(defaultFilters);

  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  const toggleDifficulty = useCallback((difficulty: DifficultyFilter) => {
    setFilters((prev) => ({
      ...prev,
      difficulties: prev.difficulties.includes(difficulty)
        ? prev.difficulties.filter((d) => d !== difficulty)
        : [...prev.difficulties, difficulty],
    }));
  }, []);

  const toggleRegion = useCallback((regionId: string) => {
    setFilters((prev) => ({
      ...prev,
      regions: prev.regions.includes(regionId)
        ? prev.regions.filter((r) => r !== regionId)
        : [...prev.regions, regionId],
    }));
  }, []);

  const toggleRecurrence = useCallback((rec: RecurrenceFilter) => {
    setFilters((prev) => ({
      ...prev,
      recurrence: prev.recurrence.includes(rec)
        ? prev.recurrence.filter((r) => r !== rec)
        : [...prev.recurrence, rec],
    }));
  }, []);

  const setStructure = useCallback((structure: StructureFilter | null) => {
    setFilters((prev) => ({
      ...prev,
      structure: prev.structure === structure ? null : structure,
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.difficulties.length > 0) count += filters.difficulties.length;
    if (filters.regions.length > 0) count += filters.regions.length;
    if (filters.recurrence.length > 0) count += filters.recurrence.length;
    if (filters.structure) count += 1;
    return count;
  }, [filters]);

  const hasActiveFilters = activeFilterCount > 0 || filters.search.trim().length > 0;

  const filterQuests = useCallback(
    (quests: QuestResponse[]): QuestResponse[] => {
      return quests.filter((quest) => {
        const searchLower = filters.search.toLowerCase().trim();
        if (searchLower) {
          const matchesTitle = quest.title.toLowerCase().includes(searchLower);
          const matchesDescription = quest.description?.toLowerCase().includes(searchLower);
          const matchesRegion = quest.category?.name.toLowerCase().includes(searchLower);
          const matchesParent = quest.parentTitle?.toLowerCase().includes(searchLower);
          if (!matchesTitle && !matchesDescription && !matchesRegion && !matchesParent) {
            return false;
          }
        }

        if (filters.difficulties.length > 0) {
          if (!filters.difficulties.includes(quest.difficulty)) {
            return false;
          }
        }

        if (filters.regions.length > 0) {
          if (!quest.category || !filters.regions.includes(quest.category.id)) {
            return false;
          }
        }

        if (filters.recurrence.length > 0) {
          const questRecurrence = mapRecurrence(quest.recurrenceInterval);
          if (!filters.recurrence.includes(questRecurrence)) {
            return false;
          }
        }

        if (filters.structure) {
          if (filters.structure === 'has-subquests' && quest.subquestCount === 0) {
            return false;
          }
          if (filters.structure === 'is-subquest' && !quest.parentId) {
            return false;
          }
          if (filters.structure === 'parent-only' && quest.parentId) {
            return false;
          }
        }

        return true;
      });
    },
    [filters]
  );

  const getActiveFilterLabels = useCallback((): {
    type: string;
    label: string;
    value: string;
  }[] => {
    const labels: { type: string; label: string; value: string }[] = [];

    filters.difficulties.forEach((d) => {
      labels.push({ type: 'difficulty', label: d, value: d });
    });

    filters.regions.forEach((r) => {
      const cat = categories.find((c) => c.id === r);
      if (cat) {
        labels.push({ type: 'region', label: `${cat.icon} ${cat.name}`, value: r });
      }
    });

    filters.recurrence.forEach((r) => {
      const recLabels: Record<RecurrenceFilter, string> = {
        'one-off': 'One-off',
        daily: 'Daily',
        weekly: 'Weekly',
        habit: 'Habit',
      };
      labels.push({ type: 'recurrence', label: recLabels[r], value: r });
    });

    if (filters.structure) {
      const structLabels: Record<StructureFilter, string> = {
        'has-subquests': 'Has subquests',
        'is-subquest': 'Is subquest',
        'parent-only': 'Parent only',
      };
      labels.push({
        type: 'structure',
        label: structLabels[filters.structure],
        value: filters.structure,
      });
    }

    return labels;
  }, [filters, categories]);

  const removeFilter = useCallback(
    (type: string, value: string) => {
      if (type === 'difficulty') {
        toggleDifficulty(value as DifficultyFilter);
      } else if (type === 'region') {
        toggleRegion(value);
      } else if (type === 'recurrence') {
        toggleRecurrence(value as RecurrenceFilter);
      } else if (type === 'structure') {
        setStructure(null);
      }
    },
    [toggleDifficulty, toggleRegion, toggleRecurrence, setStructure]
  );

  return {
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
  };
}

function mapRecurrence(interval: QuestResponse['recurrenceInterval']): RecurrenceFilter {
  switch (interval) {
    case 'NONE':
      return 'one-off';
    case 'DAILY':
      return 'daily';
    case 'WEEKLY':
      return 'weekly';
    case 'MONTHLY':
    case 'CUSTOM':
      return 'habit';
    default:
      return 'one-off';
  }
}
