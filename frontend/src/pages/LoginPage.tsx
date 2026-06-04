import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { ModeToggle } from '@/components/mode-toggle';
import { Loader2, Eye, EyeOff, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OidcAuthenticationError } from '@/lib/oidc';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    try {
      await login(data.email, data.password);
      navigate('/inbox');
    } catch (err: unknown) {
      if (err instanceof OidcAuthenticationError) {
        setError('Invalid email or password');
      } else if (err && typeof err === 'object' && 'message' in err) {
        setError((err as { message: string }).message);
      } else {
        setError('Invalid email or password');
      }
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4 animate-in fade-in duration-500 relative">
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
          <h1 className="text-2xl font-semibold tracking-tight">Questify</h1>
          <p className="text-sm text-muted-foreground">
            {t('login.tagline_line1')}
            <br />
            {t('login.tagline_line2')}
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="animate-in slide-in-from-top-2">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('login.email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('login.email_placeholder')}
              {...register('email')}
              autoFocus
              className={cn(errors.email && 'border-destructive focus-visible:ring-destructive')}
            />
            {errors.email && (
              <p className="text-xs text-destructive flex items-center gap-1 animate-in slide-in-from-left-1">
                <X className="w-3 h-3" /> {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t('login.password')}</Label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-primary hover:underline underline-offset-4"
              >
                {t('login.forgot_password')}
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('login.password_placeholder')}
                {...register('password')}
                className={cn(
                  'pr-10',
                  errors.password && 'border-destructive focus-visible:ring-destructive'
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive flex items-center gap-1 animate-in slide-in-from-left-1">
                <X className="w-3 h-3" /> {errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('login.logging_in')}
              </>
            ) : (
              t('login.submit')
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {t('login.new_user')}{' '}
          <Link
            to="/signup"
            className="font-medium text-primary hover:underline underline-offset-4"
          >
            {t('login.signup_link')}
          </Link>
        </p>
      </div>
    </div>
  );
}
