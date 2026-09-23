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
import { useDateLocale } from '@/hooks/useDateLocale';
import type { QuestResponse } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface SubquestProgressToggleProps {
  completed: number;
  total: number;
  open: boolean;
  onToggle: () => void;
  compact?: boolean;
  faded?: boolean;
}

export function SubquestProgressToggle({
  completed,
  total,
  open,
  onToggle,
  compact = false,
  faded = false,
}: SubquestProgressToggleProps) {
  const { t } = useTranslation();
  const percent = total > 0 ? (completed / total) * 100 : 0;
  const isDone = total > 0 && completed === total;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className={cn(
        'inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0',
        compact ? 'text-[11px]' : 'text-xs',
        faded && 'opacity-50'
      )}
    >
      {open ? (
        <ChevronDown className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      ) : (
        <ChevronRight className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      )}
      <span
        className={cn(
          'inline-block h-1 rounded-full bg-muted overflow-hidden',
          compact ? 'w-6' : 'w-8'
        )}
      >
        <span
          className={cn('block h-full rounded-full', isDone ? 'bg-green-500' : 'bg-primary')}
          style={{ width: `${percent}%` }}
        />
      </span>
      {compact ? (
        <span className="font-mono tabular-nums">
          {completed}/{total}
        </span>
      ) : (
        <span className="font-medium">{t('subquests.count', { completed, total })}</span>
      )}
    </button>
  );
}

interface InlineSubquestsProps {
  parentQuest: QuestResponse;
  isOpen: boolean;
  onComplete?: (id: string, element?: HTMLElement) => void;
  onEdit?: (quest: QuestResponse) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export function InlineSubquests({
  parentQuest,
  isOpen,
  onComplete,
  onEdit,
  onDelete,
  compact = false,
}: InlineSubquestsProps) {
  const { t } = useTranslation();
  const { data: subquests, isLoading } = useSubquests(parentQuest.templateId, isOpen);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'ml-1 pl-3 border-l-2 border-muted/60 space-y-0.5',
        compact ? 'mt-1.5' : 'mt-2'
      )}
    >
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
            compact={compact}
          />
        ))
      )}
    </div>
  );
}

interface SubquestRowProps {
  subquest: QuestResponse;
  onComplete?: (id: string, element?: HTMLElement) => void;
  onEdit?: (quest: QuestResponse) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

function SubquestRow({
  subquest,
  onComplete,
  onEdit,
  onDelete,
  compact = false,
}: SubquestRowProps) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const isCompleted = subquest.status === 'COMPLETED';

  const handleComplete = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isCompleted) return;
    onComplete?.(subquest.id, event.currentTarget);
  };

  const formatDueDate = (dueDate: string) => {
    try {
      return formatDistanceToNow(new Date(dueDate), { addSuffix: true, locale: dateLocale });
    } catch {
      return '';
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-1 -mx-1 rounded group/subquest transition-colors',
        compact ? 'py-1' : 'py-1.5',
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
          'text-muted-foreground flex-1 min-w-0 truncate cursor-pointer hover:text-foreground',
          compact ? 'text-[11px]' : 'text-xs',
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
        {subquest.dueDate && !isCompleted && !compact && (
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
