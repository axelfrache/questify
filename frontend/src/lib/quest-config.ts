export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC';

export interface DifficultyConfig {
  label: string;
  xp: number;
  textColor: string;
  bgColor: string;
  borderColor: string;
}

export const DIFFICULTY_CONFIG: Record<DifficultyLevel, DifficultyConfig> = {
  EASY: {
    label: 'Easy',
    xp: 50,
    textColor: 'text-quest-easy',
    bgColor: 'bg-quest-easy/10',
    borderColor: 'border-quest-easy/20',
  },
  MEDIUM: {
    label: 'Medium',
    xp: 75,
    textColor: 'text-quest-medium',
    bgColor: 'bg-quest-medium/10',
    borderColor: 'border-quest-medium/20',
  },
  HARD: {
    label: 'Hard',
    xp: 100,
    textColor: 'text-quest-hard',
    bgColor: 'bg-quest-hard/10',
    borderColor: 'border-quest-hard/20',
  },
  EPIC: {
    label: 'Epic',
    xp: 150,
    textColor: 'text-quest-epic',
    bgColor: 'bg-quest-epic/10',
    borderColor: 'border-quest-epic/20',
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
