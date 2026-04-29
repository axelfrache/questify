import { useState, memo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash, SkipForward, Plus, Repeat2 } from 'lucide-react';
import { DifficultyChip } from '@/components/ui/quest-meta-chip';
import { XpBadge } from '@/components/ui/xp-badge';
import { InlineSubquests } from '@/components/InlineSubquests';
import { cn } from '@/lib/utils';
import { RECURRENCE_LABELS } from '@/lib/quest-config';
import type { QuestResponse } from '@/lib/api';
import type { Density } from '@/types/inboxTypes';

interface QuestCardProps {
  quest: QuestResponse;
  onComplete?: (id: string, checkboxElement?: HTMLElement) => void;
  onEdit?: (quest: QuestResponse) => void;
  onDelete?: (id: string) => void;
  onSkip?: (id: string) => void;
  onAddSubquest?: (parentQuest: QuestResponse) => void;
  isPending?: boolean;
  disabled?: boolean;
  hideCheckbox?: boolean;
  showInlineSubquests?: boolean;
  density?: Density;
  showRegionMarker?: boolean;
}

function QuestCardInner({
  quest,
  onComplete,
  onEdit,
  onDelete,
  onSkip,
  onAddSubquest,
  isPending = false,
  disabled = false,
  hideCheckbox = false,
  showInlineSubquests = false,
  density = 'comfort',
  showRegionMarker = true,
}: QuestCardProps) {
  const [completing, setCompleting] = useState(false);
  const isCompact = density === 'compact';
  const isCompleted = quest.status === 'COMPLETED';
  const hasRecurrence = quest.recurrenceInterval !== 'NONE';

  const handleCheckboxClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isCompleted || disabled || completing) return;
    const target = event.currentTarget;

    setCompleting(true);
    setTimeout(() => {
      onComplete?.(quest.id, target);
      // completing is cleared naturally on re-render when isCompleted becomes true
    }, 500);
  };

  return (
    <div
      className={cn(
        'group bg-card border border-border rounded-md overflow-hidden',
        'transition-[transform,opacity,background-color] duration-150',
        completing && 'translate-x-2 opacity-70',
        isCompleted && 'opacity-50',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      {/* Main row */}
      <div
        className={cn(
          'relative flex items-center gap-3',
          isCompact ? 'px-3.5 py-2.5' : 'px-4 py-3',
          !isCompleted && !disabled && !completing && 'hover:bg-muted/40'
        )}
      >
        {/* Checkbox */}
        {!hideCheckbox && (
          <div className="flex-shrink-0">
            <Checkbox
              checked={isCompleted || completing}
              onClick={handleCheckboxClick}
              disabled={isCompleted || isPending || disabled}
              className="rounded-sm"
            />
          </div>
        )}

        {/* Content */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => !isCompleted && !disabled && !completing && onEdit?.(quest)}
        >
          <div
            className={cn(
              'text-sm font-medium leading-snug text-foreground',
              (isCompleted || completing) && 'line-through text-muted-foreground'
            )}
          >
            {quest.title}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <DifficultyChip difficulty={quest.difficulty} faded={isCompleted} />

            {hasRecurrence && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-[11px] text-muted-foreground',
                  isCompleted && 'opacity-50'
                )}
              >
                <Repeat2 className="h-3 w-3" />
                {RECURRENCE_LABELS[quest.recurrenceInterval]}
              </span>
            )}

            {showRegionMarker && quest.category?.name && (
              <span
                className={cn('text-[11px] text-muted-foreground', isCompleted && 'opacity-50')}
              >
                · {quest.category.name}
              </span>
            )}

            {quest.parentTitle && (
              <span
                className={cn('text-[11px] text-muted-foreground', isCompleted && 'opacity-50')}
              >
                · {quest.parentTitle}
              </span>
            )}
          </div>
        </div>

        {/* Right: XP + actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <XpBadge xp={quest.totalXpReward} faded={isCompleted} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                disabled={disabled}
              >
                <MoreVertical className="h-3.5 w-3.5" />
                <span className="sr-only">Quest actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(quest)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {hasRecurrence && quest.status === 'PENDING' && onSkip && (
                <DropdownMenuItem onClick={() => onSkip(quest.id)}>
                  <SkipForward className="mr-2 h-4 w-4" />
                  Skip today
                </DropdownMenuItem>
              )}
              {!quest.parentId && onAddSubquest && (
                <DropdownMenuItem onClick={() => onAddSubquest(quest)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add subquest
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => onDelete?.(quest.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Floating XP text — plays during the 500ms completion window */}
        {completing && (
          <div
            aria-hidden
            className="pointer-events-none absolute right-14 top-1/2 -translate-y-1/2 font-mono text-[13px] font-semibold text-primary"
            style={{ animation: 'xpFloat 900ms ease-out forwards' }}
          >
            +{quest.totalXpReward} XP
          </div>
        )}
      </div>

      {/* Inline subquests — rendus dans le flux normal, le card s'étend verticalement */}
      {showInlineSubquests && quest.subquestCount > 0 && (
        <div className={isCompact ? 'px-3.5 pb-2.5' : 'px-4 pb-3'}>
          <InlineSubquests
            parentQuest={quest}
            onComplete={onComplete}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      )}
    </div>
  );
}

export const QuestCard = memo(QuestCardInner);
