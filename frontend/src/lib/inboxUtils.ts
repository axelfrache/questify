import { startOfDay, isBefore, isSameDay, addDays, isWithinInterval } from 'date-fns';
import type { QuestResponse } from '@/lib/api';
import {
  type DueBucket,
  type GroupedQuests,
  type SortBy,
  DIFFICULTY_RANK,
  DUE_BUCKET_ORDER,
} from '@/types/inboxTypes';

export function getDueBucket(dueDate: string | undefined): DueBucket {
  if (!dueDate) return 'noDueDate';

  const date = startOfDay(new Date(dueDate));
  const today = startOfDay(new Date());

  if (isBefore(date, today)) return 'overdue';
  if (isSameDay(date, today)) return 'today';
  if (isWithinInterval(date, { start: today, end: addDays(today, 7) })) return 'soon';
  return 'later';
}

export function getDifficultyRank(difficulty: QuestResponse['difficulty']): number {
  return DIFFICULTY_RANK[difficulty] ?? 2;
}

export function applySortAndBuckets(quests: QuestResponse[], sortBy: SortBy): QuestResponse[] {
  return [...quests].sort((a, b) => {
    if (sortBy === 'dueDate') {
      const bucketA = DUE_BUCKET_ORDER[getDueBucket(a.dueDate)];
      const bucketB = DUE_BUCKET_ORDER[getDueBucket(b.dueDate)];
      if (bucketA !== bucketB) return bucketA - bucketB;

      const priorityDiff = getDifficultyRank(b.difficulty) - getDifficultyRank(a.difficulty);
      if (priorityDiff !== 0) return priorityDiff;

      const xpDiff = b.totalXpReward - a.totalXpReward;
      if (xpDiff !== 0) return xpDiff;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }

    if (sortBy === 'priority') {
      const priorityDiff = getDifficultyRank(b.difficulty) - getDifficultyRank(a.difficulty);
      if (priorityDiff !== 0) return priorityDiff;

      const bucketA = DUE_BUCKET_ORDER[getDueBucket(a.dueDate)];
      const bucketB = DUE_BUCKET_ORDER[getDueBucket(b.dueDate)];
      if (bucketA !== bucketB) return bucketA - bucketB;

      return b.totalXpReward - a.totalXpReward;
    }

    if (sortBy === 'xp') {
      return b.totalXpReward - a.totalXpReward;
    }

    if (sortBy === 'created') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }

    return 0;
  });
}

export function groupByRegion(
  quests: QuestResponse[],
  pinnedRegions: string[],
  collapsedRegions: Set<string>
): GroupedQuests[] {
  const regionMap = new Map<string, QuestResponse[]>();

  for (const quest of quests) {
    const regionId = quest.category?.id ?? '__inbox__';
    if (!regionMap.has(regionId)) {
      regionMap.set(regionId, []);
    }
    regionMap.get(regionId)!.push(quest);
  }

  const groups: GroupedQuests[] = [];

  for (const [regionId, regionQuests] of regionMap) {
    const firstQuest = regionQuests[0];
    const isInbox = regionId === '__inbox__';

    groups.push({
      regionId: isInbox ? null : regionId,
      regionName: isInbox ? 'Inbox' : (firstQuest.category?.name ?? 'Unknown'),
      regionIcon: isInbox ? '📥' : (firstQuest.category?.icon ?? '📁'),
      regionColor: isInbox ? '#6b7280' : (firstQuest.category?.color ?? '#6b7280'),
      quests: regionQuests,
      totalCount: regionQuests.length,
      overdueCount: regionQuests.filter((q) => getDueBucket(q.dueDate) === 'overdue').length,
      isPinned: pinnedRegions.includes(regionId),
      isCollapsed: collapsedRegions.has(regionId),
      isPinnable: true,
    });
  }

  groups.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    if (a.regionId === null && b.regionId !== null) return 1;
    if (a.regionId !== null && b.regionId === null) return -1;
    return a.regionName.localeCompare(b.regionName);
  });

  return groups;
}

export function groupByProject(
  quests: QuestResponse[],
  collapsedSections: Set<string>,
  pinnedProjectIds: string[]
): GroupedQuests[] {
  const looseSectionId = '__loose__';
  const looseQuests: QuestResponse[] = [];
  const projectMap = new Map<string, QuestResponse[]>();

  for (const quest of quests) {
    const projectId = quest.project?.id;
    if (!projectId) {
      looseQuests.push(quest);
      continue;
    }

    if (!projectMap.has(projectId)) {
      projectMap.set(projectId, []);
    }
    projectMap.get(projectId)!.push(quest);
  }

  const projectGroups: GroupedQuests[] = [];
  for (const [projectId, projectQuests] of projectMap) {
    const firstQuest = projectQuests[0];
    projectGroups.push({
      regionId: projectId,
      regionName: firstQuest.project?.name ?? 'Project',
      regionIcon: firstQuest.project?.icon ?? '📁',
      regionColor: '#0ea5e9',
      quests: projectQuests,
      totalCount: projectQuests.length,
      overdueCount: projectQuests.filter((q) => getDueBucket(q.dueDate) === 'overdue').length,
      isPinned: pinnedProjectIds.includes(projectId),
      isCollapsed: collapsedSections.has(projectId),
      isPinnable: false,
    });
  }

  projectGroups.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return a.regionName.localeCompare(b.regionName);
  });

  if (looseQuests.length === 0) {
    return projectGroups;
  }

  return [
    {
      regionId: looseSectionId,
      regionName: 'Loose quests',
      regionIcon: '📥',
      regionColor: '#6b7280',
      quests: looseQuests,
      totalCount: looseQuests.length,
      overdueCount: looseQuests.filter((q) => getDueBucket(q.dueDate) === 'overdue').length,
      isPinned: false,
      isCollapsed: collapsedSections.has(looseSectionId),
      isPinnable: false,
    },
    ...projectGroups,
  ];
}

export function applyQuickFilters(
  quests: QuestResponse[],
  filters: { overdue: boolean; today: boolean }
): QuestResponse[] {
  if (!filters.overdue && !filters.today) return quests;

  return quests.filter((quest) => {
    const bucket = getDueBucket(quest.dueDate);
    if (filters.overdue && bucket === 'overdue') return true;
    return filters.today && bucket === 'today';
  });
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  }) as T;
}
