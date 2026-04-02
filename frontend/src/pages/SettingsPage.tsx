import { useState, useRef, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTheme } from '@/components/theme-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api';
import {
  useChangePassword,
  useDeleteProfilePicture,
  useUpdateUserProfile,
  useUploadProfilePicture,
  useUserProfile,
} from '@/hooks/use-api';
import { Upload, Trash2, Loader2, Save, Globe, Lock, AlertTriangle } from 'lucide-react';
import { DeleteAccountDialog } from '@/components/DeleteAccountDialog';

function PasswordChangeForm({ userId }: { userId?: string }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const changePasswordMutation = useChangePassword();

  const handleChangePassword = async () => {
    if (!userId) return;

    setError(null);
    setSuccess(false);

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        id: userId,
        data: { currentPassword, newPassword },
      });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to change password');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current-password">Current Password</Label>
        <Input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Enter current password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-password">New Password</Label>
        <Input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
        />
        <p className="text-xs text-muted-foreground">Minimum 8 characters required.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm New Password</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">Password changed successfully!</p>}
      <Button
        onClick={handleChangePassword}
        disabled={
          changePasswordMutation.isPending || !currentPassword || !newPassword || !confirmPassword
        }
      >
        {changePasswordMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Changing...
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            Change Password
          </>
        )}
      </Button>
    </div>
  );
}

const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { value: 'America/Chicago', label: 'Chicago (CST/CDT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
];

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, updateUser, logout } = useAuth();
  const { data: profile } = useUserProfile(user?.id);
  const updateUserProfileMutation = useUpdateUserProfile();
  const uploadProfilePictureMutation = useUploadProfilePicture();
  const deleteProfilePictureMutation = useDeleteProfilePicture();
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile?.timezone) {
      setTimezone(profile.timezone);
    }
  }, [profile?.timezone]);

  useEffect(() => {
    setUsername(user?.username || '');
  }, [user?.username]);

  useEffect(() => {
    setBio(profile?.bio ?? '');
  }, [profile?.bio]);

  const getInitials = () => {
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || '?';
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    setProfileError(null);

    try {
      const updatedUser = await uploadProfilePictureMutation.mutateAsync({ id: user.id, file });
      updateUser({
        username: updatedUser.username,
        bio: updatedUser.bio,
        profilePictureUrl: updatedUser.profilePictureUrl,
      });
    } catch (error) {
      if (error instanceof ApiError || error instanceof Error) {
        setProfileError(error.message);
      } else {
        setProfileError('Failed to upload profile picture');
      }
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePicture = async () => {
    if (!user?.id) return;

    setProfileError(null);

    try {
      const updatedUser = await deleteProfilePictureMutation.mutateAsync(user.id);
      updateUser({
        username: updatedUser.username,
        bio: updatedUser.bio,
        profilePictureUrl: updatedUser.profilePictureUrl,
      });
    } catch (error) {
      if (error instanceof ApiError || error instanceof Error) {
        setProfileError(error.message);
      } else {
        setProfileError('Failed to delete profile picture');
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    setProfileError(null);
    setProfileSuccess(false);

    try {
      const updatedUser = await updateUserProfileMutation.mutateAsync({
        id: user.id,
        data: { username, timezone, bio },
      });
      updateUser({
        username: updatedUser.username,
        bio: updatedUser.bio,
        profilePictureUrl: updatedUser.profilePictureUrl,
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (error) {
      if (error instanceof ApiError || error instanceof Error) {
        setProfileError(error.message);
      } else {
        setProfileError('Failed to update profile');
      }
    }
  };

  const handleTimezoneChange = (value: string) => {
    setTimezone(value);
    if (!user?.id) return;
    setProfileError(null);
    updateUserProfileMutation.mutate(
      { id: user.id, data: { timezone: value } },
      {
        onSuccess: (updatedUser) => {
          updateUser({
            username: updatedUser.username,
            bio: updatedUser.bio,
            profilePictureUrl: updatedUser.profilePictureUrl,
          });
        },
        onError: (error) => {
          if (error instanceof ApiError || error instanceof Error) {
            setProfileError(error.message);
          } else {
            setProfileError('Failed to update timezone');
          }
        },
      }
    );
  };

  const isUploading = uploadProfilePictureMutation.isPending;
  const isDeleting = deleteProfilePictureMutation.isPending;
  const isSavingProfile = updateUserProfileMutation.isPending;
  const isProfileUnchanged =
    username.trim() === (user?.username ?? '') && bio === (profile?.bio ?? '');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>
      <Separator />

      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-4">Appearance</h2>
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Select the theme for the application.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Interface Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Select the theme for the application.
                </p>
              </div>
              <Select
                value={theme}
                onValueChange={(value: 'light' | 'dark' | 'system') => setTheme(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Account</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Manage your profile details and picture.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20 text-3xl">
                    <AvatarImage src={user?.profilePictureUrl || undefined} alt={user?.username} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      id="profile-picture-input"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Picture
                        </>
                      )}
                    </Button>
                    {user?.profilePictureUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeletePicture}
                        disabled={isDeleting}
                        className="text-destructive hover:text-destructive"
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Your username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user?.email || ''} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      maxLength={280}
                      placeholder="A short line about your focus, interests, or current quest."
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>This bio will be displayed on your profile page.</span>
                      <span>{bio.length}/280</span>
                    </div>
                  </div>
                  {profileError && <p className="text-sm text-destructive">{profileError}</p>}
                  {profileSuccess && (
                    <p className="text-sm text-green-600">Profile updated successfully!</p>
                  )}
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile || isProfileUnchanged}
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>Update your password to keep your account secure.</CardDescription>
              </CardHeader>
              <CardContent>
                <PasswordChangeForm userId={user?.id} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Timezone
                </CardTitle>
                <CardDescription>Set your timezone for accurate quest scheduling.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Your Timezone</Label>
                    <p className="text-sm text-muted-foreground">
                      Used for daily resets and scheduling.
                    </p>
                  </div>
                  <Select value={timezone} onValueChange={handleTimezoneChange}>
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4 text-destructive">Danger Zone</h2>
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Delete Account
              </CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data. This action cannot be
                undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete My Account
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>

      {user?.id && (
        <DeleteAccountDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          userId={user.id}
          onSuccess={logout}
        />
      )}
    </div>
  );
}
