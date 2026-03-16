import { memo } from 'react';
import { ChevronDown, ChevronRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuestCard } from '@/components/QuestCard';
import { cn } from '@/lib/utils';
import type { QuestResponse } from '@/lib/api';
import type { Density } from '@/types/inboxTypes';

interface RegionSectionProps {
  regionId: string | null;
  regionName: string;
  regionIcon: string;
  regionColor: string;
  quests: QuestResponse[];
  totalCount: number;
  overdueCount: number;
  isPinned: boolean;
  isCollapsed: boolean;
  isPinnable?: boolean;
  density: Density;
  onToggleCollapse: (regionId: string) => void;
  onTogglePin?: (regionId: string) => void;
  onComplete?: (id: string, checkboxElement?: HTMLElement) => void;
  onEdit?: (quest: QuestResponse) => void;
  onDelete?: (id: string) => void;
  onAddSubquest?: (parentQuest: QuestResponse) => void;
  isPending?: boolean;
  showRegionMarker?: boolean;
}

const MemoizedQuestCard = memo(QuestCard);

export function RegionSection({
  regionId,
  regionName,
  regionIcon,
  regionColor,
  quests,
  totalCount,
  overdueCount,
  isPinned,
  isCollapsed,
  isPinnable = true,
  density,
  onToggleCollapse,
  onTogglePin,
  onComplete,
  onEdit,
  onDelete,
  onAddSubquest,
  isPending = false,
  showRegionMarker = false,
}: RegionSectionProps) {
  const effectiveRegionId = regionId ?? '__inbox__';

  return (
    <div className="relative mb-6">
      <div
        className={cn(
          'sticky top-0 z-10',
          'flex items-center gap-2 h-9 px-2',
          'bg-background/80 backdrop-blur-sm',
          'border-b border-border/40'
        )}
      >
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: regionColor }} />

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 hover:bg-muted/50"
          onClick={() => onToggleCollapse(effectiveRegionId)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </Button>

        <span className="text-sm">{regionIcon}</span>

        <span className="font-medium text-sm truncate flex-1">{regionName}</span>

        <span className="text-xs text-muted-foreground tabular-nums">{totalCount}</span>

        {overdueCount > 0 && (
          <span className="text-[10px] font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
            {overdueCount} overdue
          </span>
        )}

        {isPinnable && onTogglePin && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-6 w-6 shrink-0 opacity-40 hover:opacity-100 transition-opacity',
              isPinned && 'opacity-100 text-yellow-500'
            )}
            onClick={() => onTogglePin(effectiveRegionId)}
            title={isPinned ? 'Unpin region' : 'Pin region'}
          >
            <Star className={cn('h-3.5 w-3.5', isPinned && 'fill-current')} />
          </Button>
        )}
      </div>

      {!isCollapsed && (
        <div className="space-y-2 pt-1.5 pb-3 pl-5">
          {quests.map((quest) => (
            <MemoizedQuestCard
              key={quest.id}
              quest={quest}
              onComplete={onComplete}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddSubquest={onAddSubquest}
              isPending={isPending}
              showInlineSubquests
              density={density}
              showRegionMarker={showRegionMarker}
            />
          ))}
        </div>
      )}
    </div>
  );
}
