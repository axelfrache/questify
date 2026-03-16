import type { QuestResponse } from '@/lib/api';

export type GroupBy = 'none' | 'project' | 'region';

export type SortBy = 'dueDate' | 'priority' | 'xp' | 'created';

export type Density = 'compact' | 'comfort';

export type DueBucket = 'overdue' | 'today' | 'soon' | 'later' | 'noDueDate';

export interface QuickFilters {
  overdue: boolean;
  today: boolean;
}

export interface InboxState {
  search: string;
  groupBy: GroupBy;
  sortBy: SortBy;
  density: Density;
  quickFilters: QuickFilters;
  pinnedRegions: string[];
  page: number;
  pageSize: number;
}

export interface GroupedQuests {
  regionId: string | null;
  regionName: string;
  regionIcon: string;
  regionColor: string;
  quests: QuestResponse[];
  totalCount: number;
  overdueCount: number;
  isPinned: boolean;
  isCollapsed: boolean;
  isPinnable: boolean;
}

export const DEFAULT_INBOX_STATE: InboxState = {
  search: '',
  groupBy: 'none',
  sortBy: 'dueDate',
  density: 'comfort',
  quickFilters: { overdue: false, today: false },
  pinnedRegions: [],
  page: 1,
  pageSize: 50,
};

export const DIFFICULTY_RANK: Record<QuestResponse['difficulty'], number> = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
  EPIC: 4,
};

export const DUE_BUCKET_ORDER: Record<DueBucket, number> = {
  overdue: 0,
  today: 1,
  soon: 2,
  later: 3,
  noDueDate: 4,
};
