import { useState, memo } from 'react';
import { useTranslation } from 'react-i18next';
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
  onView?: (quest: QuestResponse) => void;
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
  footer?: React.ReactNode;
}

function QuestCardInner({
  quest,
  onComplete,
  onView,
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
  footer,
}: QuestCardProps) {
  const { t } = useTranslation();
  const [completing, setCompleting] = useState(false);
  const isCompact = density === 'compact';
  const isCompleted = quest.status === 'COMPLETED';
  const hasRecurrence = quest.recurrenceInterval !== 'NONE';
  const hasSubquests = quest.subquestCount > 0;

  const handleCheckboxClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isCompleted || disabled || completing) return;
    const target = event.currentTarget;

    setCompleting(true);
    setTimeout(() => {
      onComplete?.(quest.id, target);
    }, 500);
  };

  const handleContentClick = () => {
    if (disabled || completing) return;
    if (onView) onView(quest);
    else if (!isCompleted) onEdit?.(quest);
  };

  const isClickable = (onView || (!isCompleted && onEdit)) && !disabled && !completing;

  const actionsMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100',
            isCompact ? 'h-6 w-6' : 'h-7 w-7'
          )}
          disabled={disabled}
        >
          <MoreVertical className={isCompact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
          <span className="sr-only">{t('quest_card.actions')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit?.(quest)}>
          <Edit className="mr-2 h-4 w-4" />
          {t('quest_card.edit')}
        </DropdownMenuItem>
        {hasRecurrence && quest.status === 'PENDING' && onSkip && (
          <DropdownMenuItem onClick={() => onSkip(quest.id)}>
            <SkipForward className="mr-2 h-4 w-4" />
            {t('quest_card.skip')}
          </DropdownMenuItem>
        )}
        {!quest.parentId && onAddSubquest && (
          <DropdownMenuItem onClick={() => onAddSubquest(quest)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('quest_card.add_subquest')}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => onDelete?.(quest.id)}
          className="text-destructive focus:text-destructive"
        >
          <Trash className="mr-2 h-4 w-4" />
          {t('quest_card.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

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
      {isCompact ? (
        <div
          className={cn(
            'relative flex items-center gap-2 px-3 py-1.5',
            !isCompleted && !disabled && !completing && 'hover:bg-muted/40'
          )}
        >
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

          <span
            className={cn(
              'flex-1 min-w-0 text-sm leading-none truncate',
              isClickable && 'cursor-pointer',
              (isCompleted || completing) && 'line-through text-muted-foreground'
            )}
            onClick={handleContentClick}
          >
            {quest.title}
          </span>

          {hasRecurrence && (
            <span
              className={cn('shrink-0 text-muted-foreground', isCompleted && 'opacity-50')}
              title={RECURRENCE_LABELS[quest.recurrenceInterval]}
            >
              <Repeat2 className="h-3 w-3" />
            </span>
          )}

          {hasSubquests && (
            <span
              className={cn(
                'shrink-0 font-mono text-[10px] text-muted-foreground',
                'rounded border border-border px-1.5 py-0.5 leading-none',
                isCompleted && 'opacity-50'
              )}
            >
              {quest.completedSubquestCount}/{quest.subquestCount}
            </span>
          )}

          <DifficultyChip difficulty={quest.difficulty} faded={isCompleted} />

          {showRegionMarker && quest.category?.name && (
            <span
              className={cn(
                'shrink-0 w-16 text-right truncate text-[11px] text-muted-foreground',
                isCompleted && 'opacity-50'
              )}
            >
              {quest.category.name}
            </span>
          )}

          <XpBadge xp={quest.totalXpReward} faded={isCompleted} />

          {actionsMenu}

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
      ) : (
        <div
          className={cn(
            'relative flex items-center gap-3 px-4 py-3',
            !isCompleted && !disabled && !completing && 'hover:bg-muted/40'
          )}
        >
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

          <div
            className={cn('flex-1 min-w-0', isClickable && 'cursor-pointer')}
            onClick={handleContentClick}
          >
            <div
              className={cn(
                'text-sm font-medium leading-snug text-foreground',
                (isCompleted || completing) && 'line-through text-muted-foreground'
              )}
            >
              {quest.title}
            </div>

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

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <XpBadge xp={quest.totalXpReward} faded={isCompleted} />
            {actionsMenu}
          </div>

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
      )}

      {!isCompact && showInlineSubquests && hasSubquests && (
        <div className="px-4 pb-3">
          <InlineSubquests
            parentQuest={quest}
            onComplete={onComplete}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      )}

      {!isCompact && footer && (
        <div className="border-t border-border/60 bg-muted/20 px-4 py-2">{footer}</div>
      )}
    </div>
  );
}

export const QuestCard = memo(QuestCardInner);
