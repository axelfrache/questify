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

export function RegionCard({ stats, questCount = 0, onClick, onEdit, onDelete }: RegionCardProps) {
  const canManage = stats.source !== 'GLOBAL';

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
          <div className="font-mono text-[11px] text-muted-foreground">{questCount} quests</div>
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
                <span className="sr-only">Region actions</span>
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
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
