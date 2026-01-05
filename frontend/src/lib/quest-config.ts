export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC';

export interface DifficultyConfig {
  label: string;
  xp: number;
  textColor: string;
  bgColor: string;
}

export const DIFFICULTY_CONFIG: Record<DifficultyLevel, DifficultyConfig> = {
  EASY: {
    label: 'Easy',
    xp: 50,
    textColor: 'text-difficulty-easy',
    bgColor: 'bg-[var(--difficulty-easy-bg)]',
  },
  MEDIUM: {
    label: 'Medium',
    xp: 75,
    textColor: 'text-difficulty-medium',
    bgColor: 'bg-[var(--difficulty-medium-bg)]',
  },
  HARD: {
    label: 'Hard',
    xp: 100,
    textColor: 'text-difficulty-hard',
    bgColor: 'bg-[var(--difficulty-hard-bg)]',
  },
  EPIC: {
    label: 'Epic',
    xp: 150,
    textColor: 'text-difficulty-epic',
    bgColor: 'bg-[var(--difficulty-epic-bg)]',
  },
};

export type RecurrenceType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  NONE: '',
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  CUSTOM: 'Custom',
};
