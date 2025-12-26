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
    textColor: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  MEDIUM: {
    label: 'Medium',
    xp: 75,
    textColor: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  HARD: {
    label: 'Hard',
    xp: 100,
    textColor: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  EPIC: {
    label: 'Epic',
    xp: 150,
    textColor: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
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
