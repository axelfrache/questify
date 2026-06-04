import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UserDto } from '@/lib/api';

interface AdminCreateUserRequest {
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isEnabled: boolean;
  password?: string;
}

interface AdminUpdateUserRequest {
  username?: string;
  email?: string;
  role?: 'USER' | 'ADMIN';
  isEnabled?: boolean;
  password?: string;
}

const userSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  role: z.enum(['USER', 'ADMIN']),
  isEnabled: z.boolean().optional(),
  password: z.string().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserDto | null;
  onSubmit: (data: AdminCreateUserRequest | AdminUpdateUserRequest) => Promise<void>;
}

export function UserFormModal({ open, onOpenChange, user, onSubmit }: UserFormModalProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(false);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      email: '',
      role: 'USER',
      isEnabled: true,
      password: '',
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username,
        email: user.email,
        role: user.role,
        isEnabled: user.isEnabled,
        password: '',
      });
      setChangePassword(false);
    } else {
      form.reset({
        username: '',
        email: '',
        role: 'USER',
        isEnabled: true,
        password: '',
      });
      setChangePassword(true);
    }
  }, [user, form, open]);

  const handleSubmit = async (data: UserFormValues) => {
    if (!user && !data.password) {
      form.setError('password', { message: t('user_form.password_required') });
      return;
    }
    if (user && changePassword && (!data.password || data.password.length < 8)) {
      if (!(changePassword && !data.password)) {
        if (data.password && data.password.length < 8) {
          form.setError('password', { message: t('user_form.password_min_error') });
          return;
        }
      }
    }

    try {
      const payload: AdminCreateUserRequest | AdminUpdateUserRequest = {
        username: data.username,
        email: data.email,
        role: data.role,
        isEnabled: data.isEnabled ?? true,
      };

      if ((changePassword || !user) && data.password) {
        payload.password = data.password;
      }

      await onSubmit(payload);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{user ? t('user_form.edit_title') : t('user_form.create_title')}</DialogTitle>
          <DialogDescription>
            {user ? t('user_form.edit_description') : t('user_form.create_description')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('user_form.username')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('user_form.email')}</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>{t('user_form.role')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('user_form.role_placeholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USER">{t('user_form.role_user')}</SelectItem>
                        <SelectItem value="ADMIN">{t('user_form.role_admin')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-col justify-end pb-2">
                    <FormLabel className="mb-2">{t('user_form.account_status')}</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <span className="text-sm text-muted-foreground">
                        {field.value ? t('user_form.active') : t('user_form.disabled')}
                      </span>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {user && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="change-password"
                  checked={changePassword}
                  onCheckedChange={setChangePassword}
                />
                <label
                  htmlFor="change-password"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t('user_form.change_password')}
                </label>
              </div>
            )}

            {(changePassword || !user) && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{user ? t('user_form.new_password') : t('user_form.password')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder={user ? t('user_form.password_hint') : ''}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      {t('user_form.password_min')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {user ? t('user_form.save') : t('user_form.create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
