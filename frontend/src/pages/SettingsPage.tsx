import { useState, useRef, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTheme } from '@/components/theme-provider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import {
  useChangePassword,
  useDeleteProfilePicture,
  useUpdateUserProfile,
  useUploadProfilePicture,
  useUserProfile,
} from '@/hooks/use-api';
import { Upload, Trash2, Loader2, Save, Globe, Lock, AlertTriangle } from 'lucide-react';
import { DeleteAccountDialog } from '@/components/DeleteAccountDialog';

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
  description?: React.ReactNode;
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
      setError(err instanceof Error ? err.message : 'Failed to change password');
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="current-password" className="text-xs">
          Current password
        </Label>
        <Input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-password" className="text-xs">
          New password
        </Label>
        <Input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Min. 8 characters"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm-password" className="text-xs">
          Confirm new password
        </Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {success && <p className="text-xs text-primary">Password changed successfully.</p>}
      <Button
        variant="outline"
        size="sm"
        onClick={handleChangePassword}
        disabled={
          changePasswordMutation.isPending || !currentPassword || !newPassword || !confirmPassword
        }
      >
        {changePasswordMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            Changing…
          </>
        ) : (
          <>
            <Lock className="mr-2 h-3.5 w-3.5" />
            Change password
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
    if (profile?.timezone) setTimezone(profile.timezone);
  }, [profile?.timezone]);
  useEffect(() => {
    setUsername(user?.username || '');
  }, [user?.username]);
  useEffect(() => {
    setBio(profile?.bio ?? '');
  }, [profile?.bio]);

  const getInitials = () =>
    user?.username
      ? user.username.charAt(0).toUpperCase()
      : user?.email?.charAt(0).toUpperCase() || '?';

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setProfileError(null);
    try {
      const u = await uploadProfilePictureMutation.mutateAsync({ id: user.id, file });
      updateUser({ username: u.username, bio: u.bio, profilePictureUrl: u.profilePictureUrl });
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to upload picture');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeletePicture = async () => {
    if (!user?.id) return;
    setProfileError(null);
    try {
      const u = await deleteProfilePictureMutation.mutateAsync(user.id);
      updateUser({ username: u.username, bio: u.bio, profilePictureUrl: u.profilePictureUrl });
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to delete picture');
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setProfileError(null);
    setProfileSuccess(false);
    try {
      const u = await updateUserProfileMutation.mutateAsync({
        id: user.id,
        data: { username, timezone, bio },
      });
      updateUser({ username: u.username, bio: u.bio, profilePictureUrl: u.profilePictureUrl });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const handleTimezoneChange = (value: string) => {
    setTimezone(value);
    if (!user?.id) return;
    setProfileError(null);
    updateUserProfileMutation.mutate(
      { id: user.id, data: { timezone: value } },
      {
        onSuccess: (u) =>
          updateUser({ username: u.username, bio: u.bio, profilePictureUrl: u.profilePictureUrl }),
        onError: (err) =>
          setProfileError(err instanceof Error ? err.message : 'Failed to update timezone'),
      }
    );
  };

  const isUploading = uploadProfilePictureMutation.isPending;
  const isDeleting = deleteProfilePictureMutation.isPending;
  const isSavingProfile = updateUserProfileMutation.isPending;
  const isProfileUnchanged =
    username.trim() === (user?.username ?? '') && bio === (profile?.bio ?? '');

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Appearance */}
      <div>
        <SectionLabel>Appearance</SectionLabel>
        <div className="rounded-lg border bg-card px-5 py-4">
          <SettingRow label="Theme" description="Select the interface color scheme">
            <Select value={theme} onValueChange={(v: 'light' | 'dark' | 'system') => setTheme(v)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
        </div>
      </div>

      {/* Profile */}
      <div>
        <SectionLabel>Profile</SectionLabel>
        <div className="rounded-lg border bg-card px-5 py-5 space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <Avatar className="h-16 w-16 text-2xl">
              <AvatarImage src={user?.profilePictureUrl || undefined} alt={user?.username} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1.5">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-3.5 w-3.5" />
                    Upload picture
                  </>
                )}
              </Button>
              {user?.profilePictureUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeletePicture}
                  disabled={isDeleting}
                  className="justify-start px-2 text-destructive/80 hover:text-destructive hover:bg-destructive/8"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Removing…
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Remove
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Fields */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs">
                Username
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">
                Email
              </Label>
              <Input id="email" value={user?.email || ''} disabled className="bg-muted" />
              <p className="text-[11px] text-muted-foreground">Email cannot be changed.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bio" className="text-xs">
                Bio
              </Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={280}
                placeholder="A short line about your focus or current quest."
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Displayed on your profile page.</span>
                <span>{bio.length}/280</span>
              </div>
            </div>
            {profileError && <p className="text-xs text-destructive">{profileError}</p>}
            {profileSuccess && <p className="text-xs text-primary">Profile updated.</p>}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveProfile}
              disabled={isSavingProfile || isProfileUnchanged}
            >
              {isSavingProfile ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-3.5 w-3.5" />
                  Save changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Security */}
      <div>
        <SectionLabel>Security</SectionLabel>
        <div className="rounded-lg border bg-card px-5 py-5 space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-sm font-medium">Change password</p>
          </div>
          <PasswordChangeForm userId={user?.id} />
        </div>
      </div>

      {/* Localisation */}
      <div>
        <SectionLabel>Localisation</SectionLabel>
        <div className="rounded-lg border bg-card px-5 py-4">
          <SettingRow
            label="Timezone"
            description={
              <>
                <Globe className="inline h-3 w-3 mr-1" />
                Used for daily resets and scheduling
              </>
            }
          >
            <Select value={timezone} onValueChange={handleTimezoneChange}>
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMON_TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>
        </div>
      </div>

      {/* Danger zone */}
      <div>
        <SectionLabel>Danger zone</SectionLabel>
        <div className="rounded-lg border border-destructive/20 bg-card px-5 py-5 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            <p className="text-sm font-medium text-destructive">Delete account</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Permanently removes your account, quests, progress, and all associated data. This action
            cannot be undone.
          </p>
          <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete my account
          </Button>
        </div>
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
