import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useSubquests, useCompleteQuest } from '@/hooks/use-api';
import type { QuestResponse } from '@/lib/api';

interface SubquestListProps {
  parentQuest: QuestResponse;
  onComplete?: (id: string, element?: HTMLElement) => void;
}

export function SubquestList({ parentQuest, onComplete }: SubquestListProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: subquests, isLoading } = useSubquests(parentQuest.templateId, isExpanded);

  const hasSubquests = parentQuest.subquestCount > 0;

  if (!hasSubquests) return null;

  return (
    <div className="mt-2">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="h-3.5 w-3.5 mr-1" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 mr-1" />
        )}
        {t('subquests.count', {
          completed: parentQuest.completedSubquestCount,
          total: parentQuest.subquestCount,
        })}
      </Button>

      {isExpanded && (
        <div className="ml-4 mt-2 space-y-1.5 border-l-2 border-muted pl-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t('subquests.loading')}
            </div>
          ) : (
            subquests?.map((subquest) => (
              <SubquestItem key={subquest.id} subquest={subquest} onComplete={onComplete} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface SubquestItemProps {
  subquest: QuestResponse;
  onComplete?: (id: string, element?: HTMLElement) => void;
}

function SubquestItem({ subquest, onComplete }: SubquestItemProps) {
  const isCompleted = subquest.status === 'COMPLETED';
  const completeMutation = useCompleteQuest();

  const handleComplete = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isCompleted) return;
    const target = event.currentTarget;
    onComplete?.(subquest.id, target);
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 py-1.5 px-2 rounded-md transition-colors',
        'hover:bg-muted/50',
        isCompleted && 'opacity-60'
      )}
    >
      <Checkbox
        checked={isCompleted}
        onClick={handleComplete}
        disabled={isCompleted || completeMutation.isPending}
        className="h-4 w-4"
      />
      <span className={cn('text-sm flex-1', isCompleted && 'line-through text-muted-foreground')}>
        {subquest.title}
      </span>
      {isCompleted && <Check className="h-3.5 w-3.5 text-green-500" />}
    </div>
  );
}
