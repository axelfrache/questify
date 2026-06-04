import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Edit,
  Trash,
  Calendar,
  MoreHorizontal,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { DIFFICULTY_CONFIG } from '@/lib/quest-config';
import { useSubquests } from '@/hooks/use-api';
import type { QuestResponse } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface InlineSubquestsProps {
  parentQuest: QuestResponse;
  onComplete?: (id: string, element?: HTMLElement) => void;
  onEdit?: (quest: QuestResponse) => void;
  onDelete?: (id: string) => void;
}

export function InlineSubquests({
  parentQuest,
  onComplete,
  onEdit,
  onDelete,
}: InlineSubquestsProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: subquests, isLoading } = useSubquests(parentQuest.templateId, isExpanded);

  const hasSubquests = parentQuest.subquestCount > 0;
  if (!hasSubquests) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      <button
        type="button"
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
        <span className="font-medium">
          {t('subquests.count', {
            completed: parentQuest.completedSubquestCount,
            total: parentQuest.subquestCount,
          })}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-2 ml-1 pl-3 border-l-2 border-muted/60 space-y-0.5">
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t('subquests.loading')}
            </div>
          ) : (
            subquests?.map((subquest) => (
              <SubquestRow
                key={subquest.id}
                subquest={subquest}
                onComplete={onComplete}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface SubquestRowProps {
  subquest: QuestResponse;
  onComplete?: (id: string, element?: HTMLElement) => void;
  onEdit?: (quest: QuestResponse) => void;
  onDelete?: (id: string) => void;
}

function SubquestRow({ subquest, onComplete, onEdit, onDelete }: SubquestRowProps) {
  const { t } = useTranslation();
  const isCompleted = subquest.status === 'COMPLETED';

  const handleComplete = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isCompleted) return;
    onComplete?.(subquest.id, event.currentTarget);
  };

  const formatDueDate = (dueDate: string) => {
    try {
      return formatDistanceToNow(new Date(dueDate), { addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 py-1.5 px-1 -mx-1 rounded group/subquest transition-colors',
        'hover:bg-muted/40',
        isCompleted && 'opacity-50'
      )}
    >
      <Checkbox
        checked={isCompleted}
        onClick={handleComplete}
        disabled={isCompleted}
        className="h-3.5 w-3.5 flex-shrink-0"
      />

      {/* Title */}
      <span
        className={cn(
          'text-xs text-muted-foreground flex-1 min-w-0 truncate cursor-pointer hover:text-foreground',
          isCompleted && 'line-through'
        )}
        onClick={() => onEdit?.(subquest)}
        title={subquest.title}
      >
        {subquest.title}
      </span>

      {/* Inline metadata */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Due date */}
        {subquest.dueDate && !isCompleted && (
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/70">
            <Calendar className="h-2.5 w-2.5" />
            {formatDueDate(subquest.dueDate)}
          </span>
        )}

        {/* XP reward */}
        {subquest.totalXpReward > 0 && !isCompleted && (
          <span
            className={cn(
              'rounded-full border border-current/15 px-1.5 py-0.5 text-[10px] font-semibold',
              DIFFICULTY_CONFIG[subquest.difficulty].bgColor,
              DIFFICULTY_CONFIG[subquest.difficulty].textColor
            )}
          >
            +{subquest.totalXpReward}
          </span>
        )}

        {/* Actions menu - visible on hover */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-5 w-5 opacity-0 group-hover/subquest:opacity-100 transition-opacity',
                'focus:opacity-100'
              )}
            >
              <MoreHorizontal className="h-3 w-3" />
              <span className="sr-only">Subquest actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => onEdit?.(subquest)}>
              <Edit className="mr-2 h-3 w-3" />
              {t('common.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete?.(subquest.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash className="mr-2 h-3 w-3" />
              {t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
