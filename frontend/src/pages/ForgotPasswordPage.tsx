import { useState } from 'react';
import { Link } from 'react-router-dom';
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

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    await api.forgotPassword({ email: data.email });
    setSubmitted(true);
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
          <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and we will send you a reset link if an account exists.
          </p>
        </div>

        {submitted ? (
          <Alert>
            <AlertDescription>
              If an account exists for this email, a password reset link has been sent.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                autoFocus
                className={cn(errors.email && 'border-destructive focus-visible:ring-destructive')}
              />
              {errors.email && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <X className="w-3 h-3" /> {errors.email.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                </>
              ) : (
                'Send reset link'
              )}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Remembered it?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline underline-offset-4">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
