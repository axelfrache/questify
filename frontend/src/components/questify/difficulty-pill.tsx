import { cn } from '@/lib/utils';
import { DIFFICULTY_CONFIG, type DifficultyLevel } from '@/lib/quest-config';

interface DifficultyPillProps {
  level: DifficultyLevel;
  faded?: boolean;
  className?: string;
}

export function DifficultyPill({ level, faded = false, className }: DifficultyPillProps) {
  const config = DIFFICULTY_CONFIG[level];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium border',
        config.bgColor,
        config.textColor,
        config.borderColor,
        faded && 'opacity-50',
        className
      )}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-sm', config.bgColor.replace('/10', ''))}
        style={{ background: 'currentColor' }}
      />
      {config.label}
    </span>
  );
}
