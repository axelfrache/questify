import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategoryStats } from '@/lib/api';

interface RegionCardProps {
  stats: CategoryStats;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function RegionCard({ stats, onClick, onEdit, onDelete }: RegionCardProps) {
  const activeQuests = stats.totalQuests - stats.completedQuests;

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-200',
        'border-l-[3px] hover:scale-[1.01] hover:shadow-md cursor-pointer'
      )}
      style={{ borderLeftColor: stats.color }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3" onClick={onClick}>
          {/* Emoji icon with colored background */}
          <div
            className="text-2xl w-12 h-12 flex items-center justify-center rounded-lg flex-shrink-0"
            style={{ backgroundColor: `${stats.color}15` }}
          >
            {stats.icon}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-semibold leading-tight truncate">{stats.name}</h3>

              {/* Actions menu - visible on hover */}
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

            {/* Progress section */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {activeQuests === 0
                    ? 'No active quests'
                    : `${activeQuests} active ${activeQuests === 1 ? 'quest' : 'quests'}`}
                </span>
                <span>{stats.grade}</span>
              </div>
              <Progress value={stats.progress} className="h-1.5" />
              <p className="text-xs text-muted-foreground">
                {stats.completedQuests}/{stats.totalQuests} completed
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
