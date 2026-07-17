import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAssignQuest, useProjectMembers, useUserSummaries } from '@/hooks/use-api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuestResponse } from '@/lib/api';

interface AssignQuestDialogProps {
  quest: QuestResponse | null;
  projectId: string;
  onOpenChange: (open: boolean) => void;
}

export function AssignQuestDialog({ quest, projectId, onOpenChange }: AssignQuestDialogProps) {
  const { t } = useTranslation();
  const { data: members = [] } = useProjectMembers(projectId);
  const { data: summaries } = useUserSummaries(members.map((m) => m.userId));
  const userById = useMemo(() => new Map((summaries ?? []).map((u) => [u.id, u])), [summaries]);
  const assignMutation = useAssignQuest();

  const handleAssign = (assigneeId: string | null) => {
    if (!quest) return;
    assignMutation.mutate(
      { questId: quest.templateId ?? quest.id, assigneeId },
      {
        onSuccess: () => {
          toast.success(t('project_detail.assign_success'));
          onOpenChange(false);
        },
        onError: () => toast.error(t('project_detail.assign_failed')),
      }
    );
  };

  return (
    <Dialog open={!!quest} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('project_detail.assign_title')}</DialogTitle>
          <DialogDescription className="truncate">{quest?.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-1">
          {members.map((member) => {
            const summary = userById.get(member.userId);
            const name = summary?.username ?? `User ${member.userId.slice(0, 8)}`;
            const isAssignee = quest?.assigneeId === member.userId;

            return (
              <button
                key={member.userId}
                type="button"
                disabled={assignMutation.isPending}
                onClick={() => handleAssign(member.userId)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors',
                  isAssignee ? 'border-primary/40 bg-primary/5' : 'border-border hover:bg-muted/50'
                )}
              >
                <Avatar className="size-7">
                  <AvatarImage src={summary?.profilePictureUrl || undefined} alt={name} />
                  <AvatarFallback className="text-[10px] font-medium">
                    {name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate text-sm font-medium">{name}</span>
                {member.role === 'OWNER' && (
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    {t('project_detail.role_owner')}
                  </span>
                )}
                {isAssignee && <Check className="h-4 w-4 text-primary" />}
              </button>
            );
          })}

          {quest?.assigneeId && (
            <button
              type="button"
              disabled={assignMutation.isPending}
              onClick={() => handleAssign(null)}
              className="flex w-full items-center gap-3 rounded-md border border-dashed border-border px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/50"
            >
              <UserX className="h-4 w-4" />
              {t('project_detail.unassign')}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
