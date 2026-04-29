import { cn } from '@/lib/utils';

interface XpBadgeProps {
  xp: number;
  className?: string;
}

export function XpBadge({ xp, className }: XpBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5',
        'text-xs font-medium font-mono tracking-tight',
        'bg-xp-bg text-xp-fg border border-xp-border',
        className
      )}
    >
      +{xp}
      <span className="text-[9px] opacity-70">XP</span>
    </span>
  );
}
