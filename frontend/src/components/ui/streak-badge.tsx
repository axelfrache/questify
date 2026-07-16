import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakBadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function StreakBadge({ children, className }: StreakBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        'border-streak/30 bg-streak/10 text-streak',
        className
      )}
    >
      <Flame className="h-3 w-3" />
      <span className="font-mono">{children}</span>
    </span>
  );
}
