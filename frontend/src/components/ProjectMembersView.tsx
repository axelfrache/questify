import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  useChangeMemberRole,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { ChevronDown, Copy, Plus, Trash2 } from 'lucide-react';
import type { ProjectDetailResponse, ProjectRole, QuestResponse } from '@/lib/api';

interface ProjectMembersViewProps {
  project: ProjectDetailResponse;
  quests: QuestResponse[];
}

const ROLE_BADGE: Record<ProjectRole, string> = {
  OWNER: 'border-primary/30 bg-primary/10 text-primary',
  ADMIN: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  MEMBER: 'border-border bg-muted text-muted-foreground',
  VIEWER: 'border-border bg-transparent text-muted-foreground',
};

const ASSIGNABLE_ROLES: ProjectRole[] = ['ADMIN', 'MEMBER', 'VIEWER'];

export function ProjectMembersView({ project, quests }: ProjectMembersViewProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: members = [] } = useProjectMembers(project.id);
  const { data: summaries } = useUserSummaries(members.map((m) => m.userId));
  const userById = useMemo(() => new Map((summaries ?? []).map((u) => [u.id, u])), [summaries]);
  const inviteMutation = useInviteProject();
  const removeMutation = useRemoveProjectMember();
  const roleMutation = useChangeMemberRole();

  const [inviteDialog, setInviteDialog] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteExpiry, setInviteExpiry] = useState<string | null>(null);

  const myRole = members.find((m) => m.userId === user?.id)?.role;
  const canManage = myRole === 'OWNER' || myRole === 'ADMIN';

  const roleLabel = (role: ProjectRole) => t(`project_detail.role_${role.toLowerCase()}`);

  const roleOptionsFor = (targetRole: ProjectRole) =>
    ASSIGNABLE_ROLES.filter((role) => role !== targetRole).filter(
      (role) => myRole === 'OWNER' || role !== 'ADMIN'
    );

  const canManageMember = (targetRole: ProjectRole, isSelf: boolean) => {
    if (!canManage || isSelf || targetRole === 'OWNER') return false;
    if (myRole === 'ADMIN' && targetRole === 'ADMIN') return false;
    return true;
  };

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
      removeMutation.mutate(
        { projectId: project.id, memberId },
        { onError: () => toast.error(t('project_detail.member_action_failed')) }
      );
    }
  };

  const handleChangeRole = (memberId: string, role: ProjectRole) => {
    roleMutation.mutate(
      { projectId: project.id, memberId, role },
      { onError: () => toast.error(t('project_detail.member_action_failed')) }
    );
  };

  const getMemberQuestCount = (memberId: string) =>
    quests.filter((q) => q.assigneeId === memberId && q.status === 'PENDING').length;

  const unassignedCount = quests.filter((q) => !q.assigneeId && q.status === 'PENDING').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t('project_detail.members')}</h3>
        {canManage && (
          <Button size="sm" onClick={() => setInviteDialog(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            {t('project_detail.invite')}
          </Button>
        )}
      </div>

      <div className="grid gap-3">
        {members.map((member) => {
          const questCount = getMemberQuestCount(member.userId);
          const isSelf = member.userId === user?.id;
          const summary = userById.get(member.userId);
          const name = summary?.username ?? `User ${member.userId.slice(0, 8)}`;
          const manageable = canManageMember(member.role, isSelf);

          return (
            <div
              key={member.userId}
              className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3"
            >
              <Avatar className="size-8">
                <AvatarImage src={summary?.profilePictureUrl || undefined} alt={name} />
                <AvatarFallback className="text-xs font-medium">
                  {name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <span className="truncate">{name}</span>
                  {isSelf && (
                    <span className="text-xs font-normal text-muted-foreground">
                      ({t('project_detail.you')})
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {questCount} {t('project_detail.open_quest', { count: questCount })}
                </div>
              </div>

              {manageable ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
                        ROLE_BADGE[member.role]
                      )}
                    >
                      {roleLabel(member.role)}
                      <ChevronDown className="h-3 w-3 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    {roleOptionsFor(member.role).map((role) => (
                      <DropdownMenuItem
                        key={role}
                        onClick={() => handleChangeRole(member.userId, role)}
                      >
                        {t('project_detail.set_role', { role: roleLabel(role) })}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleRemoveMember(member.userId)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('project_detail.remove_member')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <span
                  className={cn(
                    'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
                    ROLE_BADGE[member.role]
                  )}
                >
                  {roleLabel(member.role)}
                </span>
              )}
            </div>
          );
        })}

        {unassignedCount > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-dashed bg-card p-3">
            <div className="flex-1">
              <div className="text-sm font-medium text-muted-foreground">
                {t('project_detail.unassigned')}
              </div>
              <div className="text-xs text-muted-foreground">
                {unassignedCount} {t('project_detail.open_quest', { count: unassignedCount })}
              </div>
            </div>
          </div>
        )}
      </div>

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
                  className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-sm"
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
