import { useState, useEffect } from 'react';
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
import type { UserDto, AdminCreateUserRequest, AdminUpdateUserRequest } from '@/lib/api';

const userSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
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
      form.setError('password', { message: 'Password is required for new users' });
      return;
    }
    if (user && changePassword && (!data.password || data.password.length < 8)) {
      if (!(changePassword && !data.password)) {
        if (data.password && data.password.length < 8) {
          form.setError('password', { message: 'Password must be at least 8 characters' });
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
          <DialogTitle>{user ? 'Edit User' : 'Create New User'}</DialogTitle>
          <DialogDescription>
            {user
              ? "Make changes to the user profile here. Click save when you're done."
              : 'Add a new user to the system. They will receive an email with their credentials.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
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
                  <FormLabel>Email</FormLabel>
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
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USER">User</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
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
                    <FormLabel className="mb-2">Account Status</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <span className="text-sm text-muted-foreground">
                        {field.value ? 'Active' : 'Disabled'}
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
                  Change Password
                </label>
              </div>
            )}

            {(changePassword || !user) && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{user ? 'New Password' : 'Password'}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder={user ? 'Leave empty to keep current' : ''}
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
                      {user ? 'Only if you want to change it. ' : ''}
                      Must be at least 8 characters.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {user ? 'Save Changes' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
