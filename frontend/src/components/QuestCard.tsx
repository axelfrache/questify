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
import { MoreVertical, Edit, Trash } from 'lucide-react';
import { DifficultyChip, RecurrenceChip } from '@/components/ui/quest-meta-chip';
import { XpBadge } from '@/components/ui/xp-badge';
import { cn } from '@/lib/utils';
import type { QuestResponse } from '@/lib/api';

interface QuestCardProps {
  quest: QuestResponse;
  onComplete?: (id: string, checkboxElement?: HTMLElement) => void;
  onEdit?: (quest: QuestResponse) => void;
  onDelete?: (id: string) => void;
  isPending?: boolean;
  disabled?: boolean;
}

/**
 * QuestCard Component
 *
 * A polished quest card with:
 * - Category accent (left border)
 * - Improved typography hierarchy
 * - Metadata chips (recurrence, difficulty)
 * - XP badge with secondary color
 * - Card states: pending, completed, disabled
 *
 * States Logic:
 * - Pending: Normal appearance, hover effects enabled
 * - Completed: Reduced opacity, strikethrough title, chips faded
 * - Disabled: Reduced opacity, non-interactive (for future occurrences)
 */
export function QuestCard({
  quest,
  onComplete,
  onEdit,
  onDelete,
  isPending = false,
  disabled = false,
}: QuestCardProps) {
  const [showXpAnimation, setShowXpAnimation] = useState(false);

  const isCompleted = quest.status === 'COMPLETED';
  const hasCategoryColor = !!quest.category?.color;

  const handleCheckboxClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isCompleted || disabled) return;

    const target = event.currentTarget;

    // Trigger XP badge animation
    setShowXpAnimation(true);
    setTimeout(() => setShowXpAnimation(false), 600);

    onComplete?.(quest.id, target);
  };

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-200',
        // Category accent - left border
        'border-l-[3px]',
        // States
        isCompleted && 'opacity-60',
        disabled && 'opacity-40 cursor-not-allowed',
        // Hover effect (only when not completed/disabled)
        !isCompleted && !disabled && 'hover:scale-[1.01] hover:shadow-md'
      )}
      style={{
        borderLeftColor: hasCategoryColor ? quest.category!.color : 'transparent',
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <div className="pt-0.5">
            <Checkbox
              checked={isCompleted}
              onClick={handleCheckboxClick}
              disabled={isCompleted || isPending || disabled}
              className={cn('transition-transform', !isCompleted && !disabled && 'hover:scale-110')}
            />
          </div>

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
      </CardContent>
    </Card>
  );
}
