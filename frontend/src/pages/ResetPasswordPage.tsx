import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ModeToggle } from '@/components/mode-toggle';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Loader2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);
  const tokenId = useMemo(() => searchParams.get('token_id') ?? '', [searchParams]);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setError(null);
    try {
      await api.resetPassword({ tokenId: tokenId || undefined, token, newPassword: data.password });
      setCompleted(true);
      window.setTimeout(() => navigate('/login'), 1200);
    } catch {
      setError(t('reset_password.invalid_token'));
    }
  };

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-background p-4 animate-in fade-in duration-500">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <img
            src="/assets/images/questifyIcon/questify-gem-accent.svg"
            alt="Questify"
            className="w-14 h-14 mx-auto"
            draggable={false}
          />
          <h1 className="text-2xl font-semibold tracking-tight">{t('reset_password.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('reset_password.description')}
          </p>
        </div>

        {!token && (
          <Alert variant="destructive">
            <AlertDescription>{t('reset_password.missing_token')}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {completed ? (
          <Alert>
            <AlertDescription>{t('reset_password.success')}</AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t('reset_password.new_password')}</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                className={cn(
                  errors.password && 'border-destructive focus-visible:ring-destructive'
                )}
                disabled={!token}
              />
              {errors.password && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <X className="w-3 h-3" /> {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('reset_password.confirm_password')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                className={cn(
                  errors.confirmPassword && 'border-destructive focus-visible:ring-destructive'
                )}
                disabled={!token}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <X className="w-3 h-3" /> {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || !token}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('reset_password.updating')}
                </>
              ) : (
                t('reset_password.submit')
              )}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="font-medium text-primary hover:underline underline-offset-4">
            {t('forgot_password.back_to_login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
