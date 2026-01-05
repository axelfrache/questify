import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash, SkipForward, Plus } from 'lucide-react';
import { DifficultyChip, RecurrenceChip } from '@/components/ui/quest-meta-chip';
import { XpBadge } from '@/components/ui/xp-badge';
import { InlineSubquests } from '@/components/InlineSubquests';
import { cn } from '@/lib/utils';
import type { QuestResponse } from '@/lib/api';

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
}

export function QuestCard({
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
}: QuestCardProps) {
  const [showXpAnimation, setShowXpAnimation] = useState(false);

  const isCompleted = quest.status === 'COMPLETED';
  const hasCategoryColor = !!quest.category?.color;

  const handleCheckboxClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isCompleted || disabled) return;

    const target = event.currentTarget;

    setShowXpAnimation(true);
    setTimeout(() => setShowXpAnimation(false), 600);

    onComplete?.(quest.id, target);
  };

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-200',
        'border-l-[3px]',
        isCompleted && 'opacity-60',
        disabled && 'opacity-40 cursor-not-allowed',
        !isCompleted && !disabled && 'hover:scale-[1.01] hover:shadow-md',
        !hasCategoryColor && 'bg-muted/30 border-l-muted-foreground/30'
      )}
      style={{
        borderLeftColor: hasCategoryColor ? quest.category!.color : undefined,
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {!hideCheckbox && (
            <div className="pt-0.5">
              <Checkbox
                checked={isCompleted}
                onClick={handleCheckboxClick}
                disabled={isCompleted || isPending || disabled}
                className={cn(
                  'transition-transform',
                  !isCompleted && !disabled && 'hover:scale-110'
                )}
              />
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Title + Category Icon */}
            <div className="flex items-center gap-2">
              {quest.category?.icon && (
                <span className="text-sm flex-shrink-0">{quest.category.icon}</span>
              )}
              <h3
                className={cn(
                  'text-base font-medium leading-tight',
                  isCompleted && 'line-through text-muted-foreground'
                )}
              >
                {quest.title}
              </h3>
            </div>

            {/* Description (if present) */}
            {quest.description && (
              <p
                className={cn(
                  'text-sm text-muted-foreground leading-relaxed',
                  isCompleted && 'opacity-60'
                )}
              >
                {quest.description}
              </p>
            )}

            {/* Metadata chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <RecurrenceChip recurrence={quest.recurrenceInterval} faded={isCompleted} />
              <DifficultyChip difficulty={quest.difficulty} faded={isCompleted} />
              {/* Parent context for subquests */}
              {quest.parentTitle && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium rounded bg-primary/10 text-primary',
                    isCompleted && 'opacity-60'
                  )}
                >
                  Part of: {quest.parentTitle}
                </span>
              )}
            </div>
          </div>

          {/* Right side: XP badge + Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <XpBadge xp={quest.totalXpReward} animate={showXpAnimation} faded={isCompleted} />

            {/* Actions dropdown - visible on hover */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity',
                    'focus:opacity-100'
                  )}
                  disabled={disabled}
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Quest actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(quest)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                {quest.recurrenceInterval !== 'NONE' && quest.status === 'PENDING' && onSkip && (
                  <DropdownMenuItem onClick={() => onSkip(quest.id)}>
                    <SkipForward className="mr-2 h-4 w-4" />
                    Skip today
                  </DropdownMenuItem>
                )}
                {/* Add subquest option - only for root quests (not subquests themselves) */}
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
        </div>

        {/* Inline subquests - shown when showInlineSubquests is true */}
        {showInlineSubquests && quest.subquestCount > 0 && (
          <InlineSubquests
            parentQuest={quest}
            onComplete={onComplete}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
      </CardContent>
    </Card>
  );
}
