import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Edit, MoreVertical, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategoryResponse } from '@/lib/api';

interface RegionCardProps {
  stats: CategoryResponse;
  questCount?: number;
  completedCount?: number;
  xpEarned?: number;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function getRegionIcon(stats: CategoryResponse): string {
  if (stats.icon.trim().length > 0) return stats.icon;
  const n = stats.name.toLowerCase();
  if (/(productivity|work|focus|prime|task)/.test(n)) return '⚡';
  if (/(health|fit|run|sport|gym)/.test(n)) return '🏃';
  if (/(learn|study|read|book|skill|course)/.test(n)) return '📚';
  return '🧭';
}

export function RegionCard({
  stats,
  questCount = 0,
  completedCount = 0,
  xpEarned = 0,
  onClick,
  onEdit,
  onDelete,
}: RegionCardProps) {
  const { t } = useTranslation();
  const canManage = stats.source !== 'GLOBAL';
  const totalQuests = questCount + completedCount;
  const explorationPercent = totalQuests > 0 ? Math.round((completedCount / totalQuests) * 100) : 0;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border bg-card transition-all duration-150',
        onClick && 'cursor-pointer hover:border-border/80 hover:shadow-sm'
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Colored top stripe */}
      <div className="absolute left-0 right-0 top-0 h-0.5" style={{ background: stats.color }} />

      <div className="flex items-center gap-3 p-3.5 pt-4">
        {/* Icon */}
        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-base"
          style={{
            background: `color-mix(in oklch, ${stats.color} 16%, transparent)`,
            color: stats.color,
          }}
        >
          {getRegionIcon(stats)}
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-foreground">{stats.name}</div>
          <div className="font-mono text-[11px] text-muted-foreground">
            {t('region_card.quest_count', { count: questCount })}
          </div>
        </div>

        {/* Actions */}
        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3.5 w-3.5" />
                <span className="sr-only">{t('region_card.actions')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.();
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                {t('region_card.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('region_card.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {totalQuests > 0 && (
        <div className="space-y-1.5 px-3.5 pb-3">
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted/40">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${explorationPercent}%`, background: stats.color }}
            />
          </div>
          <div className="flex items-center justify-between font-mono text-[10px]">
            <span className="text-muted-foreground">
              {t('region_card.explored', { done: completedCount, total: totalQuests })}
            </span>
            {xpEarned > 0 && (
              <span style={{ color: stats.color }}>
                {t('region_card.xp', { xp: xpEarned.toLocaleString() })}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
