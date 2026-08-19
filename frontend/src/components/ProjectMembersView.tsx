import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  useCancelInvitation,
  useChangeMemberRole,
  useCreateInvitation,
  useInviteLink,
  useProjectInvitations,
  useRemoveProjectMember,
  useResendInvitation,
  useResetInviteLink,
  useProjectMembers,
  useUpdateInviteLink,
  useUserSummaries,
} from '@/hooks/use-api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ChevronDown, Copy, Mail, Plus, RotateCw, Trash2, X } from 'lucide-react';
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
const LINK_ROLES: ProjectRole[] = ['MEMBER', 'VIEWER'];

export function ProjectMembersView({ project, quests }: ProjectMembersViewProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: members = [] } = useProjectMembers(project.id);
  const { data: summaries } = useUserSummaries(members.map((m) => m.userId));
  const userById = useMemo(() => new Map((summaries ?? []).map((u) => [u.id, u])), [summaries]);

  const removeMutation = useRemoveProjectMember();
  const roleMutation = useChangeMemberRole();
  const createInvitation = useCreateInvitation();
  const resendInvitation = useResendInvitation();
  const cancelInvitation = useCancelInvitation();
  const updateInviteLink = useUpdateInviteLink();
  const resetInviteLink = useResetInviteLink();

  const myRole = members.find((m) => m.userId === user?.id)?.role;
  const canManage = myRole === 'OWNER' || myRole === 'ADMIN';

  const [inviteDialog, setInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<ProjectRole>('MEMBER');

  const { data: invitations = [] } = useProjectInvitations(canManage ? project.id : '');
  const { data: link } = useInviteLink(project.id, canManage && inviteDialog);

  const roleLabel = (role: ProjectRole) => t(`project_detail.role_${role.toLowerCase()}`);

  const invitableRoles = ASSIGNABLE_ROLES.filter((role) => myRole === 'OWNER' || role !== 'ADMIN');

  const roleOptionsFor = (targetRole: ProjectRole) =>
    ASSIGNABLE_ROLES.filter((role) => role !== targetRole).filter(
      (role) => myRole === 'OWNER' || role !== 'ADMIN'
    );

  const canManageMember = (targetRole: ProjectRole, isSelf: boolean) => {
    if (!canManage || isSelf || targetRole === 'OWNER') return false;
    if (myRole === 'ADMIN' && targetRole === 'ADMIN') return false;
    return true;
  };

  const openInvite = () => {
    setInviteEmail('');
    setInviteRole('MEMBER');
    setInviteDialog(true);
  };

  const handleSendEmail = () => {
    const email = inviteEmail.trim();
    if (!email) return;
    createInvitation.mutate(
      { projectId: project.id, data: { email, role: inviteRole } },
      {
        onSuccess: () => {
          toast.success(t('project_detail.invite_sent', { email }));
          setInviteEmail('');
        },
        onError: () => toast.error(t('project_detail.invite_email_failed')),
      }
    );
  };

  const handleCopyLink = () => {
    if (link?.url) {
      navigator.clipboard.writeText(link.url);
      toast.success(t('project_detail.link_copied'));
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t('project_detail.members')}</h3>
        {canManage && (
          <Button size="sm" onClick={openInvite} className="gap-1.5">
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
                  {t('project_detail.open_quest', { count: questCount })}
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
      </div>

      {canManage && invitations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground">
            {t('project_detail.pending_invites')}
          </h4>
          <div className="grid gap-2">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-3 rounded-lg border border-dashed bg-card p-3"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{inv.email}</div>
                  <div className="text-xs text-muted-foreground">
                    {t('project_detail.invited_as', { role: roleLabel(inv.role) })}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs"
                  disabled={resendInvitation.isPending}
                  onClick={() =>
                    resendInvitation.mutate(
                      { projectId: project.id, invitationId: inv.id },
                      {
                        onSuccess: () => toast.success(t('project_detail.invitation_resent')),
                        onError: () => toast.error(t('project_detail.member_action_failed')),
                      }
                    )
                  }
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  {t('project_detail.resend')}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() =>
                    cancelInvitation.mutate({ projectId: project.id, invitationId: inv.id })
                  }
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('project_detail.invite_to', { name: project.name })}</DialogTitle>
            <DialogDescription>{t('project_detail.invite_description')}</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="email">
            <TabsList className="w-fit">
              <TabsTrigger value="email">{t('project_detail.invite_email_tab')}</TabsTrigger>
              <TabsTrigger value="link">{t('project_detail.invite_link_tab')}</TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-3 pt-3">
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder={t('project_detail.invite_email_placeholder')}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendEmail()}
                />
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as ProjectRole)}>
                  <SelectTrigger className="w-32 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {invitableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleLabel(role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleSendEmail}
                  disabled={!inviteEmail.trim() || createInvitation.isPending}
                >
                  {createInvitation.isPending
                    ? t('project_detail.generating')
                    : t('project_detail.send_invite')}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="link" className="space-y-3 pt-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{t('project_detail.invite_link')}</div>
                  <div className="text-xs text-muted-foreground">
                    {t('project_detail.invite_link_hint')}
                  </div>
                </div>
                <Switch
                  checked={!!link?.enabled}
                  disabled={updateInviteLink.isPending}
                  onCheckedChange={(checked) =>
                    updateInviteLink.mutate({
                      projectId: project.id,
                      enabled: checked,
                      role: link?.role ?? 'MEMBER',
                    })
                  }
                />
              </div>

              {link?.enabled && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={link.url ?? ''}
                      className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyLink}
                      disabled={!link.url}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {t('project_detail.grants_role')}
                    </span>
                    <Select
                      value={link.role}
                      onValueChange={(v) =>
                        updateInviteLink.mutate({
                          projectId: project.id,
                          enabled: true,
                          role: v as ProjectRole,
                        })
                      }
                    >
                      <SelectTrigger className="h-8 w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LINK_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {roleLabel(role)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground"
                      disabled={resetInviteLink.isPending}
                      onClick={() => resetInviteLink.mutate({ projectId: project.id })}
                    >
                      {t('project_detail.reset_link')}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
