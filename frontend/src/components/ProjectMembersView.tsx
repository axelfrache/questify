import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import {
  useInviteProject,
  useRemoveProjectMember,
  useProjectMembers,
  useUserSummaries,
} from '@/hooks/use-api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectDetailResponse, QuestResponse } from '@/lib/api';

interface ProjectMembersViewProps {
  project: ProjectDetailResponse;
  quests: QuestResponse[];
}

export function ProjectMembersView({ project, quests }: ProjectMembersViewProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: members = [] } = useProjectMembers(project.id);
  const { data: summaries } = useUserSummaries(members.map((m) => m.userId));
  const userById = useMemo(() => new Map((summaries ?? []).map((u) => [u.id, u])), [summaries]);
  const inviteMutation = useInviteProject();
  const removeMutation = useRemoveProjectMember();

  const [inviteDialog, setInviteDialog] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteExpiry, setInviteExpiry] = useState<string | null>(null);

  const isOwner = project.ownerUserId === user?.id;

  const handleInvite = async () => {
    try {
      const result = await inviteMutation.mutateAsync(project.id);
      setInviteToken(result.token);
      setInviteExpiry(result.expiresAt);
    } catch {
      toast.error(t('project_detail.invite_failed'));
    }
  };

  const handleCopyToken = () => {
    if (inviteToken) {
      navigator.clipboard.writeText(inviteToken);
      toast.success(t('project_detail.token_copied'));
    }
  };

  const handleRemoveMember = (memberId: string) => {
    if (confirm(t('project_detail.confirm_remove_member'))) {
      removeMutation.mutate({ projectId: project.id, memberId });
    }
  };

  const getMemberQuestCount = (memberId: string) => {
    return quests.filter((q) => q.assigneeId === memberId && q.status === 'PENDING').length;
  };

  const getUnassignedQuestCount = () => {
    return quests.filter((q) => !q.assigneeId && q.status === 'PENDING').length;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t('project_detail.members')}</h3>
        {isOwner && (
          <Button size="sm" onClick={() => setInviteDialog(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            {t('project_detail.invite')}
          </Button>
        )}
      </div>

      {/* Member cards */}
      <div className="grid gap-3">
        {members.map((member) => {
          const questCount = getMemberQuestCount(member.userId);
          const isCurrentUser = member.userId === user?.id;
          const summary = userById.get(member.userId);
          const name = summary?.username ?? `User ${member.userId.slice(0, 8)}`;

          return (
            <div
              key={member.userId}
              className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card"
            >
              <Avatar className="size-8">
                <AvatarImage src={summary?.profilePictureUrl || undefined} alt={name} />
                <AvatarFallback className="text-xs font-medium">
                  {name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <span className="truncate">{name}</span>
                  {isCurrentUser && (
                    <span className="text-xs font-normal text-muted-foreground">
                      ({t('project_detail.you')})
                    </span>
                  )}
                  {member.role === 'OWNER' && (
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      {t('project_detail.role_owner')}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {questCount} {t('project_detail.open_quest', { count: questCount })}
                </div>
              </div>
              {isOwner && !isCurrentUser && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMember(member.userId)}
                  disabled={removeMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        })}

        {/* Unassigned quests card */}
        {getUnassignedQuestCount() > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg border bg-card border-dashed">
            <div className="flex-1">
              <div className="text-sm font-medium text-muted-foreground">
                {t('project_detail.unassigned')}
              </div>
              <div className="text-xs text-muted-foreground">
                {getUnassignedQuestCount()}{' '}
                {t('project_detail.open_quest', { count: getUnassignedQuestCount() })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('project_detail.send_invite')}</DialogTitle>
            <DialogDescription>{t('project_detail.invite_description')}</DialogDescription>
          </DialogHeader>

          {inviteToken ? (
            <div className="space-y-4">
              <Alert>
                <AlertDescription className="text-xs">
                  {t('project_detail.invite_expires')}
                  {inviteExpiry && new Date(inviteExpiry).toLocaleDateString()}
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteToken}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted font-mono"
                />
                <Button size="sm" onClick={handleCopyToken} variant="outline">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                {t('project_detail.share_instructions')}
              </p>

              <Button onClick={() => setInviteDialog(false)} className="w-full">
                {t('project_detail.done')}
              </Button>
            </div>
          ) : (
            <Button onClick={handleInvite} disabled={inviteMutation.isPending} className="w-full">
              {inviteMutation.isPending
                ? t('project_detail.generating')
                : t('project_detail.generate_invite')}
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
