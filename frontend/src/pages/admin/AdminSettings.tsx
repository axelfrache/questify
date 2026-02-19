import { useState, useEffect } from 'react';
import {
  api,
  type UserDto,
  type AdminCreateUserRequest,
  type AdminUpdateUserRequest,
} from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Loader2, Settings2, Users, Plus, Trash2, Pencil } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { UserFormModal } from '@/components/admin/UserFormModal';

export function AdminSettings() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<{ registrationEnabled: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsData, usersPage] = await Promise.all([api.getSettings(), api.getUsers()]);
      setSettings(settingsData);
      setUsers(usersPage.content);
    } catch (err: unknown) {
      const error = err as { message: string; userData?: { message: string } };
      setError(error.userData?.message || error.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const toggleRegistration = async () => {
    if (!settings) return;
    try {
      const updated = await api.updateSettings({
        registrationEnabled: !settings.registrationEnabled,
      });
      setSettings(updated);
    } catch (err: unknown) {
      const error = err as { message: string; userData?: { message: string } };
      setError(error.userData?.message || error.message || 'Failed to update settings');
    }
  };

  const handleCreateClick = () => {
    setSelectedUser(null);
    setIsUserModalOpen(true);
  };

  const handleEditClick = (user: UserDto) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const handleUserFormSubmit = async (data: AdminCreateUserRequest | AdminUpdateUserRequest) => {
    try {
      if (selectedUser) {
        await api.adminUpdateUser(selectedUser.id, data as AdminUpdateUserRequest);
      } else {
        await api.adminCreateUser(data as AdminCreateUserRequest);
      }
      loadData();
    } catch (err: unknown) {
      // Re-throw to let modal handle it if needed, or set error here
      const error = err as { message: string };
      setError(error.message || 'Operation failed');
      throw err;
    }
  };

  const toggleUserStatus = async (user: UserDto) => {
    // Prevent disabling self
    if (currentUser?.id === user.id) {
      return;
    }
    try {
      await api.adminUpdateUserStatus(user.id, !user.isEnabled);
      loadData();
    } catch (err: unknown) {
      const error = err as { message: string };
      setError(error.message || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !window.confirm('Are you sure you want to delete this user? This action cannot be undone.')
    ) {
      return;
    }
    try {
      await api.adminDeleteUser(userId);
      loadData(); // Reload list
    } catch (err: unknown) {
      const error = err as { message: string };
      setError(error.message || 'Failed to delete user');
    }
  };

  const getInitials = (username: string) => {
    return username.charAt(0).toUpperCase();
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage instance settings and users.</p>
      </div>
      <Separator />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Instance Settings
          </h2>
          <Card>
            <CardHeader>
              <CardTitle>Registration Control</CardTitle>
              <CardDescription>Manage user registration access.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="font-medium">User Registration</span>
                <p className="text-sm text-muted-foreground">Allow new users to create accounts</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {settings?.registrationEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <Switch
                  checked={settings?.registrationEnabled}
                  onCheckedChange={toggleRegistration}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users Management
            </h2>
            <Button onClick={handleCreateClick}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Registered Users</CardTitle>
              <CardDescription>A list of all users registered on this instance.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={u.profilePictureUrl || undefined}
                                alt={u.username}
                              />
                              <AvatarFallback>{getInitials(u.username)}</AvatarFallback>
                            </Avatar>
                            {u.username}
                          </div>
                        </TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'}>
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {u.isEnabled ? (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                Active
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-destructive border-destructive"
                              >
                                Disabled
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-2">
                            <Switch
                              checked={u.isEnabled}
                              onCheckedChange={() => toggleUserStatus(u)}
                              disabled={currentUser.id === u.id}
                            />

                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(u)}>
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                              onClick={() => handleDeleteUser(u.id)}
                              disabled={currentUser.id === u.id}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <UserFormModal
        open={isUserModalOpen}
        onOpenChange={setIsUserModalOpen}
        user={selectedUser}
        onSubmit={handleUserFormSubmit}
      />
    </div>
  );
}
