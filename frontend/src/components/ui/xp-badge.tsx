import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface XpBadgeProps {
  xp: number;
  className?: string;
  animate?: boolean;
  faded?: boolean;
}

export function XpBadge({ xp, className, animate = false, faded = false }: XpBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold',
        'bg-secondary/20 text-secondary',
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
