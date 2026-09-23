import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { DIFFICULTY_CONFIG, getDifficultyLabel, type DifficultyLevel } from '@/lib/quest-config';

interface QuestMetaChipProps {
  children: React.ReactNode;
  className?: string;
  faded?: boolean;
}

export function QuestMetaChip({ children, className, faded = false }: QuestMetaChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition-opacity',
        'bg-muted text-muted-foreground',
        faded && 'opacity-50',
        className
      )}
    >
      {children}
    </span>
  );
}

export function DifficultyChip({
  difficulty,
  faded = false,
}: {
  difficulty: DifficultyLevel;
  faded?: boolean;
}) {
  const { t } = useTranslation();
  const config = DIFFICULTY_CONFIG[difficulty];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium border',
        config.bgColor,
        config.textColor,
        config.borderColor,
        faded && 'opacity-50'
      )}
    >
      <span className="h-1.5 w-1.5 rounded-[2px] bg-current opacity-70" />
      {getDifficultyLabel(t, difficulty)}
    </span>
  );
}
