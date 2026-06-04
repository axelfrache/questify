import { useState, useRef, useEffect } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
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
import {
  Upload,
  Trash2,
  Loader2,
  Save,
  Globe,
  Lock,
  AlertTriangle,
  User,
  SlidersHorizontal,
  Shield,
  Camera,
  Languages,
} from 'lucide-react';
import { DeleteAccountDialog } from '@/components/DeleteAccountDialog';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';

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

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
      {children}
    </p>
  );
}

function PasswordChangeForm({ userId }: { userId?: string }) {
  const { t } = useTranslation();
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
      setError(t('settings.security.password_min_length'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('settings.security.passwords_mismatch'));
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
          {t('settings.security.current_password')}
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
          {t('settings.security.new_password')}
        </Label>
        <Input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder={t('settings.security.new_password_placeholder')}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm-password" className="text-xs">
          {t('settings.security.confirm_password')}
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
      {success && <p className="text-xs text-primary">{t('settings.security.password_changed')}</p>}
      <div className="flex justify-end pt-1">
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
              {t('settings.security.changing')}
            </>
          ) : (
            <>
              <Lock className="mr-2 h-3.5 w-3.5" />
              {t('settings.security.update_password')}
            </>
          )}
        </Button>
      </div>
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

const LANGUAGES = [
  { value: 'en', labelKey: 'settings.preferences.language_en' },
  { value: 'fr', labelKey: 'settings.preferences.language_fr' },
];

export function SettingsPage() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user, updateUser, logout } = useAuth();
  const { data: profile } = useUserProfile(user?.id);
  const updateUserProfileMutation = useUpdateUserProfile();
  const uploadProfilePictureMutation = useUploadProfilePicture();
  const deleteProfilePictureMutation = useDeleteProfilePicture();
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [language, setLanguage] = useState(i18n.language);
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

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    i18n.changeLanguage(value);
    localStorage.setItem('questify-language', value);
  };

  const isUploading = uploadProfilePictureMutation.isPending;
  const isDeleting = deleteProfilePictureMutation.isPending;
  const isSavingProfile = updateUserProfileMutation.isPending;
  const isProfileUnchanged =
    username.trim() === (user?.username ?? '') && bio === (profile?.bio ?? '');

  const tabTrigger = cn(
    'flex items-center gap-2 px-1 pb-3 pt-1 text-sm font-medium border-b-2 -mb-px',
    'text-muted-foreground border-transparent',
    'hover:text-foreground transition-colors duration-150',
    'data-[state=active]:text-foreground data-[state=active]:border-primary',
    'focus-visible:outline-none'
  );

  return (
    <div className="pb-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t('settings.description')}</p>
      </div>

      <TabsPrimitive.Root defaultValue="profile">
        {/* Underline tabs */}
        <TabsPrimitive.List className="flex gap-6 border-b border-border w-full">
          <TabsPrimitive.Trigger value="profile" className={tabTrigger}>
            <User className="h-3.5 w-3.5 shrink-0" />
            {t('settings.tabs.profile')}
          </TabsPrimitive.Trigger>
          <TabsPrimitive.Trigger value="preferences" className={tabTrigger}>
            <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
            {t('settings.tabs.preferences')}
          </TabsPrimitive.Trigger>
          <TabsPrimitive.Trigger value="security" className={tabTrigger}>
            <Shield className="h-3.5 w-3.5 shrink-0" />
            {t('settings.tabs.security')}
          </TabsPrimitive.Trigger>
        </TabsPrimitive.List>

        {/* ── Profile ── */}
        <TabsPrimitive.Content value="profile" className="mt-6 outline-none">
          <div className="rounded-lg border bg-card overflow-hidden">
            {/* Avatar header */}
            <div className="px-5 py-5 flex items-center gap-4">
              <div className="relative group/avatar shrink-0">
                <Avatar className="h-14 w-14 text-xl">
                  <AvatarImage src={user?.profilePictureUrl || undefined} alt={user?.username} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity text-white cursor-pointer disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-semibold">{user?.username || '—'}</p>
                <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  {isUploading ? t('settings.profile.uploading') : t('settings.profile.change_photo')}
                </Button>
                {user?.profilePictureUrl && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={handleDeletePicture}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Editable fields */}
            <div className="px-5 py-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-medium">
                  {t('settings.profile.username')}
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('settings.profile.username_placeholder')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">
                  {t('settings.profile.email')}
                </Label>
                <Input id="email" value={user?.email || ''} disabled className="bg-muted/60" />
                <p className="text-[11px] text-muted-foreground">{t('settings.profile.email_hint')}</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bio" className="text-xs font-medium">
                  {t('settings.profile.bio')}
                </Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  maxLength={280}
                  placeholder={t('settings.profile.bio_placeholder')}
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{t('settings.profile.bio_hint')}</span>
                  <span>{bio.length}/280</span>
                </div>
              </div>

              {profileError && <p className="text-xs text-destructive">{profileError}</p>}
              {profileSuccess && <p className="text-xs text-primary">{t('settings.profile.profile_updated')}</p>}

              <div className="flex justify-end pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile || isProfileUnchanged}
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      {t('settings.profile.saving')}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-3.5 w-3.5" />
                      {t('settings.profile.save')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </TabsPrimitive.Content>

        {/* ── Preferences ── */}
        <TabsPrimitive.Content value="preferences" className="mt-6 outline-none space-y-4">
          <div className="rounded-lg border bg-card px-5 py-4">
            <GroupLabel>{t('settings.preferences.appearance')}</GroupLabel>
            <SettingRow
              label={t('settings.preferences.theme')}
              description={t('settings.preferences.theme_description')}
            >
              <Select value={theme} onValueChange={(v: 'light' | 'dark' | 'system') => setTheme(v)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t('settings.preferences.theme_light')}</SelectItem>
                  <SelectItem value="dark">{t('settings.preferences.theme_dark')}</SelectItem>
                  <SelectItem value="system">{t('settings.preferences.theme_system')}</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
          </div>

          <div className="rounded-lg border bg-card px-5 py-4">
            <GroupLabel>{t('settings.preferences.localisation')}</GroupLabel>
            <SettingRow
              label={t('settings.preferences.timezone')}
              description={
                <>
                  <Globe className="inline h-3 w-3 mr-1" />
                  {t('settings.preferences.timezone_description')}
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
            <div className="h-px bg-border my-1" />
            <SettingRow
              label={t('settings.preferences.language')}
              description={
                <>
                  <Languages className="inline h-3 w-3 mr-1" />
                  {t('settings.preferences.language_description')}
                </>
              }
            >
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {t(lang.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingRow>
          </div>
        </TabsPrimitive.Content>

        {/* ── Security ── */}
        <TabsPrimitive.Content value="security" className="mt-6 outline-none space-y-4">
          <div className="rounded-lg border bg-card px-5 py-5">
            <GroupLabel>{t('settings.security.password')}</GroupLabel>
            <PasswordChangeForm userId={user?.id} />
          </div>

          <div className="rounded-lg border border-destructive/25 bg-card px-5 py-5">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              <p className="text-sm font-semibold text-destructive">{t('settings.security.danger_zone')}</p>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              {t('settings.security.danger_description')}
            </p>
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              {t('settings.security.delete_account')}
            </Button>
          </div>
        </TabsPrimitive.Content>
      </TabsPrimitive.Root>

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
