import { useState, useCallback, useEffect, useMemo } from 'react';
import type { QuestResponse } from '@/lib/api';
import {
  type GroupBy,
  type SortBy,
  type Density,
  type QuickFilters,
  type InboxState,
  type GroupedQuests,
  DEFAULT_INBOX_STATE,
} from '@/types/inboxTypes';
import {
  applySortAndBuckets,
  applyQuickFilters,
  groupByProject,
  groupByRegion,
} from '@/lib/inboxUtils';

const PINNED_REGIONS_KEY = 'questify.inbox.pinnedRegions';
const DENSITY_KEY = 'questify.inbox.density';
const GROUPBY_KEY = 'questify.inbox.groupBy';
const SORTBY_KEY = 'questify.inbox.sortBy';
const GROUPBY_VALUES: GroupBy[] = ['none', 'project', 'region'];

function sanitizeGroupBy(value: unknown): GroupBy {
  if (typeof value === 'string' && GROUPBY_VALUES.includes(value as GroupBy)) {
    return value as GroupBy;
  }
  return DEFAULT_INBOX_STATE.groupBy;
}

function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {} // eslint-disable-line no-empty
}

export function useInboxState(allQuests: QuestResponse[], pinnedProjectIds: string[] = []) {
  const [search, setSearchRaw] = useState('');
  const [groupBy, setGroupByRaw] = useState<GroupBy>(() =>
    sanitizeGroupBy(loadFromStorage<unknown>(GROUPBY_KEY, DEFAULT_INBOX_STATE.groupBy))
  );
  const [sortBy, setSortByRaw] = useState<SortBy>(() =>
    loadFromStorage(SORTBY_KEY, DEFAULT_INBOX_STATE.sortBy)
  );
  const [density, setDensityRaw] = useState<Density>(() =>
    loadFromStorage(DENSITY_KEY, DEFAULT_INBOX_STATE.density)
  );
  const [quickFilters, setQuickFilters] = useState<QuickFilters>({ overdue: false, today: false });
  const [pinnedRegions, setPinnedRegionsRaw] = useState<string[]>(() =>
    loadFromStorage(PINNED_REGIONS_KEY, [])
  );
  const [collapsedRegions, setCollapsedRegions] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const pageSize = DEFAULT_INBOX_STATE.pageSize;

  useEffect(() => saveToStorage(GROUPBY_KEY, groupBy), [groupBy]);
  useEffect(() => saveToStorage(SORTBY_KEY, sortBy), [sortBy]);
  useEffect(() => saveToStorage(DENSITY_KEY, density), [density]);
  useEffect(() => saveToStorage(PINNED_REGIONS_KEY, pinnedRegions), [pinnedRegions]);

  const setSearch = useCallback((value: string) => {
    setSearchRaw(value);
    setPage(1);
  }, []);

  const setGroupBy = useCallback((value: GroupBy) => {
    setGroupByRaw(value);
    setPage(1);
  }, []);

  const setSortBy = useCallback((value: SortBy) => {
    setSortByRaw(value);
    setPage(1);
  }, []);

  const setDensity = useCallback((value: Density) => {
    setDensityRaw(value);
  }, []);

  const toggleDensity = useCallback(() => {
    setDensityRaw((prev) => (prev === 'compact' ? 'comfort' : 'compact'));
  }, []);

  const toggleQuickFilter = useCallback((filter: keyof QuickFilters) => {
    setQuickFilters((prev) => ({ ...prev, [filter]: !prev[filter] }));
    setPage(1);
  }, []);

  const clearQuickFilters = useCallback(() => {
    setQuickFilters({ overdue: false, today: false });
    setPage(1);
  }, []);

  const togglePinRegion = useCallback((regionId: string) => {
    setPinnedRegionsRaw((prev) =>
      prev.includes(regionId) ? prev.filter((id) => id !== regionId) : [...prev, regionId]
    );
  }, []);

  const toggleCollapseRegion = useCallback((regionId: string) => {
    setCollapsedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(regionId)) {
        next.delete(regionId);
      } else {
        next.add(regionId);
      }
      return next;
    });
  }, []);

  const collapseAllRegions = useCallback((regionIds: string[]) => {
    setCollapsedRegions(new Set(regionIds));
  }, []);

  const expandAllRegions = useCallback(() => {
    setCollapsedRegions(new Set());
  }, []);

  const loadMore = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const resetPagination = useCallback(() => {
    setPage(1);
  }, []);

  const processedQuests = useMemo(() => {
    let result = allQuests;

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (q) =>
          q.title.toLowerCase().includes(searchLower) ||
          q.description?.toLowerCase().includes(searchLower) ||
          q.category?.name.toLowerCase().includes(searchLower) ||
          q.parentTitle?.toLowerCase().includes(searchLower)
      );
    }

    result = applyQuickFilters(result, quickFilters);

    result = applySortAndBuckets(result, sortBy);

    return result;
  }, [allQuests, search, quickFilters, sortBy]);

  const groupedQuests = useMemo((): GroupedQuests[] => {
    if (groupBy === 'none') {
      return [
        {
          regionId: null,
          regionName: 'All Quests',
          regionIcon: '📋',
          regionColor: '#6b7280',
          quests: processedQuests,
          totalCount: processedQuests.length,
          overdueCount: processedQuests.filter((q) => {
            const due = q.dueDate ? new Date(q.dueDate) : null;
            return due && due < new Date();
          }).length,
          isPinned: false,
          isCollapsed: false,
          isPinnable: false,
        },
      ];
    }

    if (groupBy === 'project') {
      return groupByProject(processedQuests, collapsedRegions, pinnedProjectIds);
    }

    return groupByRegion(processedQuests, pinnedRegions, collapsedRegions);
  }, [groupBy, processedQuests, collapsedRegions, pinnedProjectIds, pinnedRegions]);

  const paginatedQuests = useMemo(() => {
    return processedQuests.slice(0, page * pageSize);
  }, [processedQuests, page, pageSize]);

  const hasMore = paginatedQuests.length < processedQuests.length;
  const totalCount = processedQuests.length;
  const displayedCount = paginatedQuests.length;

  const overdueCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return allQuests.filter((q) => {
      if (!q.dueDate) return false;
      const due = new Date(q.dueDate);
      return due < today;
    }).length;
  }, [allQuests]);

  const todayCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return allQuests.filter((q) => {
      if (!q.dueDate) return false;
      const due = new Date(q.dueDate);
      return due >= today && due < tomorrow;
    }).length;
  }, [allQuests]);

  const state: InboxState = {
    search,
    groupBy,
    sortBy,
    density,
    quickFilters,
    pinnedRegions,
    page,
    pageSize,
  };

  return {
    state,
    search,
    groupBy,
    sortBy,
    density,
    quickFilters,
    pinnedRegions,
    collapsedRegions,

    setSearch,
    setGroupBy,
    setSortBy,
    setDensity,
    toggleDensity,
    toggleQuickFilter,
    clearQuickFilters,
    togglePinRegion,
    toggleCollapseRegion,
    collapseAllRegions,
    expandAllRegions,

    loadMore,
    resetPagination,
    hasMore,
    totalCount,
    displayedCount,

    overdueCount,
    todayCount,

    processedQuests,
    paginatedQuests,
    groupedQuests,
  };
}
