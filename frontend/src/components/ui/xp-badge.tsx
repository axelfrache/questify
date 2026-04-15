import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';
import { DIFFICULTY_CONFIG, type DifficultyLevel } from '@/lib/quest-config';

interface XpBadgeProps {
  xp: number;
  difficulty?: DifficultyLevel;
  className?: string;
  animate?: boolean;
  faded?: boolean;
}

function inferDifficultyFromXp(xp: number): DifficultyLevel {
  if (xp >= 150) return 'EPIC';
  if (xp >= 100) return 'HARD';
  if (xp >= 75) return 'MEDIUM';
  return 'EASY';
}

export function XpBadge({
  xp,
  difficulty,
  className,
  animate = false,
  faded = false,
}: XpBadgeProps) {
  const config = DIFFICULTY_CONFIG[difficulty ?? inferDifficultyFromXp(xp)];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm',
        config.bgColor,
        config.textColor,
        'border-current/15',
        'transition-all duration-300',
        animate && 'animate-pulse',
        faded && 'opacity-50',
        className
      )}
    >
      <Sparkles className="h-3 w-3" />
      <span>+{xp} XP</span>
    </span>
  );
}
