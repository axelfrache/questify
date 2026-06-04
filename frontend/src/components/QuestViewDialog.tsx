import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Calendar, Check, Edit, GitBranch, ListChecks, Repeat2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DifficultyChip } from '@/components/ui/quest-meta-chip';
import { XpBadge } from '@/components/ui/xp-badge';
import { cn } from '@/lib/utils';
import { RECURRENCE_LABELS } from '@/lib/quest-config';
import type { QuestResponse } from '@/lib/api';

interface QuestViewDialogProps {
  quest: QuestResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (quest: QuestResponse) => void;
  onComplete?: (id: string) => void;
}

export function QuestViewDialog({
  quest,
  open,
  onOpenChange,
  onEdit,
  onComplete,
}: QuestViewDialogProps) {
  const { t } = useTranslation();
  if (!quest) return null;

  const isCompleted = quest.status === 'COMPLETED';
  const hasRecurrence = quest.recurrenceInterval !== 'NONE';

  const handleEdit = () => {
    onOpenChange(false);
    setTimeout(() => onEdit?.(quest), 50);
  };

  const handleComplete = () => {
    onComplete?.(quest.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <DifficultyChip difficulty={quest.difficulty} faded={isCompleted} />
          <XpBadge xp={quest.totalXpReward} faded={isCompleted} />
          {isCompleted && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              <Check className="h-2.5 w-2.5" />
              {t('quest_view.completed')}
            </span>
          )}
        </div>

        <DialogHeader className="gap-1">
          <DialogTitle
            className={cn(
              'text-xl leading-snug',
              isCompleted && 'line-through text-muted-foreground'
            )}
          >
            {quest.title}
          </DialogTitle>
        </DialogHeader>

        {/* Description */}
        {quest.description && (
          <div
            className="text-sm text-muted-foreground -mt-1 [&_p]:leading-relaxed [&_p+p]:mt-1 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-primary/80 [&_strong]:font-semibold [&_strong]:text-foreground [&_em]:italic [&_u]:underline"
            dangerouslySetInnerHTML={{ __html: quest.description }}
          />
        )}

        {/* Meta list */}
        <div className="space-y-2">
          {quest.category && (
            <MetaRow icon={<Tag className="h-3.5 w-3.5" />}>
              <span
                className="inline-block w-2 h-2 rounded-full mr-1 shrink-0"
                style={{ backgroundColor: quest.category.color }}
              />
              {quest.category.icon && <span className="mr-1">{quest.category.icon}</span>}
              {quest.category.name}
            </MetaRow>
          )}

          {quest.dueDate && (
            <MetaRow icon={<Calendar className="h-3.5 w-3.5" />}>
              {format(new Date(quest.dueDate), 'PPP')}
            </MetaRow>
          )}

          {hasRecurrence && (
            <MetaRow icon={<Repeat2 className="h-3.5 w-3.5" />}>
              {RECURRENCE_LABELS[quest.recurrenceInterval]}
            </MetaRow>
          )}

          {quest.parentTitle && (
            <MetaRow icon={<GitBranch className="h-3.5 w-3.5" />}>
              <span className="truncate">{quest.parentTitle}</span>
            </MetaRow>
          )}

          {quest.subquestCount > 0 && (
            <MetaRow icon={<ListChecks className="h-3.5 w-3.5" />}>
              {t('subquests.count', { completed: quest.completedSubquestCount, total: quest.subquestCount })}
            </MetaRow>
          )}
        </div>

        <DialogFooter>
          {!isCompleted && onComplete && (
            <Button size="sm" onClick={handleComplete} className="gap-1.5">
              <Check className="h-3.5 w-3.5" />
              {t('quest_view.complete')}
            </Button>
          )}
          {onEdit && (
            <Button variant="outline" size="sm" onClick={handleEdit} className="gap-1.5">
              <Edit className="h-3.5 w-3.5" />
              {t('common.edit')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MetaRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="shrink-0 text-muted-foreground/60">{icon}</span>
      <span className="flex items-center min-w-0">{children}</span>
    </div>
  );
}
