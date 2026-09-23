export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC';

export interface DifficultyConfig {
  xp: number;
  textColor: string;
  bgColor: string;
  borderColor: string;
}

export const DIFFICULTY_CONFIG: Record<DifficultyLevel, DifficultyConfig> = {
  EASY: {
    xp: 50,
    textColor: 'text-quest-easy',
    bgColor: 'bg-quest-easy/10',
    borderColor: 'border-quest-easy/20',
  },
  MEDIUM: {
    xp: 75,
    textColor: 'text-quest-medium',
    bgColor: 'bg-quest-medium/10',
    borderColor: 'border-quest-medium/20',
  },
  HARD: {
    xp: 100,
    textColor: 'text-quest-hard',
    bgColor: 'bg-quest-hard/10',
    borderColor: 'border-quest-hard/20',
  },
  EPIC: {
    xp: 150,
    textColor: 'text-quest-epic',
    bgColor: 'bg-quest-epic/10',
    borderColor: 'border-quest-epic/20',
  },
};

export function getDifficultyLabel(t: (key: string) => string, level: DifficultyLevel): string {
  return t('difficulty.' + level);
}

export type RecurrenceType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';

export function getRecurrenceLabel(t: (key: string) => string, type: RecurrenceType): string {
  if (type === 'NONE') return '';
  return t('quest_dialog.' + type.toLowerCase());
}
