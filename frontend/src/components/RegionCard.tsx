import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, MoreVertical, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategoryStats } from '@/lib/api';

interface RegionCardProps {
  stats: CategoryStats;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function getRegionIcon(stats: CategoryStats): string {
  if (stats.icon.trim().length > 0) return stats.icon;

  const normalizedName = stats.name.toLowerCase();
  if (/(productivity|work|focus|prime|task)/.test(normalizedName)) return '⚡';
  if (/(health|fit|run|sport|gym)/.test(normalizedName)) return '🏃';
  if (/(learn|study|read|book|skill|course)/.test(normalizedName)) return '📚';
  return '🧭';
}

export function RegionCard({ stats, onClick, onEdit, onDelete }: RegionCardProps) {
  const activeLabel =
    stats.activeQuests === 0
      ? 'No active quests'
      : `${stats.activeQuests} active ${stats.activeQuests === 1 ? 'quest' : 'quests'}`;

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-200',
        'border-l-[3px]',
        onClick && 'cursor-pointer hover:scale-[1.01] hover:shadow-md'
      )}
      style={{ borderLeftColor: stats.color }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="text-2xl w-12 h-12 flex items-center justify-center rounded-lg flex-shrink-0 border"
            style={{ backgroundColor: `${stats.color}15`, borderColor: `${stats.color}40` }}
          >
            {getRegionIcon(stats)}
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="text-base font-semibold leading-tight truncate">{stats.name}</h3>
                <p className="text-sm text-foreground/90">{activeLabel}</p>
              </div>

              <div className="flex items-start gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-1',
                        'focus:opacity-100'
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
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
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
