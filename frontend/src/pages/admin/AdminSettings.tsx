import { useState } from 'react';
import { type UserSummaryResponse, ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  useAdminDeleteUser,
  useAdminSettings,
  useAdminUpdateUserStatus,
  useAdminUsers,
  useUpdateAdminSettings,
} from '@/hooks/use-api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Trash2, Settings2, Users } from 'lucide-react';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function AdminSettings() {
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteUserId, setPendingDeleteUserId] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  const { data: settings, isLoading: isLoadingSettings } = useAdminSettings();
  const { data: usersPage, isLoading: isLoadingUsers } = useAdminUsers(0, '');
  const updateSettingsMutation = useUpdateAdminSettings();
  const adminUpdateUserStatusMutation = useAdminUpdateUserStatus();
  const adminDeleteUserMutation = useAdminDeleteUser();

  const users = usersPage?.content ?? [];

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (err instanceof ApiError || err instanceof Error) return err.message;
    return fallback;
  };

  const toggleRegistration = async () => {
    if (!settings) return;
    try {
      setError(null);
      await updateSettingsMutation.mutateAsync({
        registrationEnabled: !settings.registrationEnabled,
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to update settings'));
    }
  };

  const toggleUserStatus = async (user: UserSummaryResponse) => {
    if (currentUser?.id === user.id) return;
    try {
      setError(null);
      await adminUpdateUserStatusMutation.mutateAsync({ id: user.id, enabled: !user.enabled });
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to update user status'));
    }
  };

  const handleDeleteUser = (userId: string) => setPendingDeleteUserId(userId);

  const confirmDeleteUser = async () => {
    if (!pendingDeleteUserId) return;
    try {
      setError(null);
      await adminDeleteUserMutation.mutateAsync(pendingDeleteUserId);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to delete user'));
    }
  };

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Access Denied: You do not have permission to view this page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">Manage instance settings and users</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Instance Settings */}
      <div>
        <SectionLabel>
          <span className="inline-flex items-center gap-1.5">
            <Settings2 className="h-3 w-3" />
            Instance settings
          </span>
        </SectionLabel>
        <div className="rounded-lg border bg-card px-5 py-4">
          {isLoadingSettings ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <SettingRow label="User registration" description="Allow new users to create accounts">
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground">
                  {settings?.registrationEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <Switch
                  checked={settings?.registrationEnabled}
                  onCheckedChange={toggleRegistration}
                  disabled={updateSettingsMutation.isPending}
                />
              </div>
            </SettingRow>
          )}
        </div>
      </div>

      {/* Users Management */}
      <div>
        <SectionLabel>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3 w-3" />
            Users management
          </span>
        </SectionLabel>
        <div className="rounded-lg border bg-card">
          {isLoadingUsers ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/60">
                    <TableHead className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground pl-5">
                      User
                    </TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                      Email
                    </TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                      Role
                    </TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                      Created
                    </TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground text-right pr-5">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} className="border-b border-border/40 last:border-0">
                      <TableCell className="pl-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7 text-xs">
                            <AvatarFallback className="bg-muted text-muted-foreground">
                              {u.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{u.username}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground py-3">
                        {u.email}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          variant="secondary"
                          className={
                            u.role === 'ADMIN' ? 'bg-primary/10 text-primary border-primary/20' : ''
                          }
                        >
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          variant="outline"
                          className={
                            u.enabled
                              ? 'text-difficulty-easy border-difficulty-easy/50 bg-difficulty-easy/8'
                              : 'text-destructive border-destructive/50 bg-destructive/8'
                          }
                        >
                          {u.enabled ? 'Active' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground py-3 font-mono text-xs">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="text-right pr-5 py-3">
                        <div className="flex justify-end items-center gap-2">
                          <Switch
                            checked={u.enabled}
                            onCheckedChange={() => toggleUserStatus(u)}
                            disabled={
                              currentUser.id === u.id || adminUpdateUserStatusMutation.isPending
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={currentUser.id === u.id || adminDeleteUserMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-sm text-muted-foreground"
                      >
                        No users found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingDeleteUserId}
        onOpenChange={(open) => !open && setPendingDeleteUserId(null)}
        title="Delete user?"
        description="This action cannot be undone."
        onConfirm={confirmDeleteUser}
      />
    </div>
  );
}
