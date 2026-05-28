import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ModeToggle } from '@/components/mode-toggle';
import { OidcAuthenticationError } from '@/lib/oidc';

const signupSchema = z.object({
  username: z.string().min(3, 'Name must be at least 3 characters'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'One uppercase letter')
    .regex(/[a-z]/, 'One lowercase letter')
    .regex(/[0-9]/, 'One number'),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupPage() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
  });

  const password = watch('password', '');
  const username = watch('username', '');

  const strengthChecks = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', valid: /[a-z]/.test(password) },
    { label: 'One number', valid: /[0-9]/.test(password) },
  ];

  const strengthScore = strengthChecks.filter((c) => c.valid).length;
  const strengthLabel = ['Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'][strengthScore];
  const strengthColor =
    strengthScore <= 2 ? 'bg-destructive' : strengthScore === 3 ? 'bg-yellow-500' : 'bg-green-500';

  const onSubmit = async (data: SignupFormValues) => {
    setError(null);
    try {
      await registerUser(data.username, data.email, data.password, data.firstName, data.lastName);
      navigate('/inbox');
    } catch (err: unknown) {
      if (err instanceof OidcAuthenticationError) {
        setError('Account created, but automatic sign-in failed. Please try signing in.');
      } else if (err && typeof err === 'object' && 'message' in err) {
        setError((err as { message: string }).message);
      } else {
        setError('Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4 animate-in fade-in duration-500 relative">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <img
            src="/assets/images/questifyIcon/questify-gem-accent.svg"
            alt="Questify"
            className="w-14 h-14 mx-auto"
            draggable={false}
          />
          <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground">Start your journey with Questify today.</p>
        </div>

        {error && (
          <Alert variant="destructive" className="animate-in slide-in-from-top-2">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Explorer Name</Label>
            <Input
              id="username"
              placeholder="e.g. Maverick"
              {...register('username')}
              autoFocus
              className={cn(errors.username && 'border-destructive focus-visible:ring-destructive')}
            />
            {errors.username && (
              <p className="text-xs text-destructive flex items-center gap-1 animate-in slide-in-from-left-1">
                <X className="w-3 h-3" /> {errors.username.message}
              </p>
            )}
            {!errors.username && username.length >= 2 && (
              <p className="text-xs text-green-500 flex items-center gap-1 animate-in fade-in">
                <Check className="w-3 h-3" /> Looks good!
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                placeholder="John"
                {...register('firstName')}
                className={cn(errors.firstName && 'border-destructive focus-visible:ring-destructive')}
              />
              {errors.firstName && (
                <p className="text-xs text-destructive flex items-center gap-1 animate-in slide-in-from-left-1">
                  <X className="w-3 h-3" /> {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                {...register('lastName')}
                className={cn(errors.lastName && 'border-destructive focus-visible:ring-destructive')}
              />
              {errors.lastName && (
                <p className="text-xs text-destructive flex items-center gap-1 animate-in slide-in-from-left-1">
                  <X className="w-3 h-3" /> {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              {...register('email')}
              className={cn(errors.email && 'border-destructive focus-visible:ring-destructive')}
            />
            {errors.email && (
              <p className="text-xs text-destructive flex items-center gap-1 animate-in slide-in-from-left-1">
                <X className="w-3 h-3" /> {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
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

            {/* Password Strength Meter */}
            <AnimatePresence>
              {password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 pt-1 overflow-hidden"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Strength</span>
                    <span
                      className={cn(
                        'font-medium',
                        strengthScore <= 2
                          ? 'text-destructive'
                          : strengthScore === 3
                            ? 'text-yellow-500'
                            : 'text-green-500'
                      )}
                    >
                      {strengthLabel}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn('h-full transition-all duration-500 ease-out', strengthColor)}
                      style={{ width: `${(strengthScore / 4) * 100}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    {strengthChecks.map((check, index) => (
                      <div
                        key={index}
                        className={cn(
                          'flex items-center gap-2 text-xs transition-colors duration-200',
                          check.valid ? 'text-green-500' : 'text-muted-foreground/60'
                        )}
                      >
                        {check.valid ? (
                          <Check className="w-3 h-3 shrink-0" />
                        ) : (
                          <div className="w-3 h-3 rounded-full border border-current shrink-0" />
                        )}
                        <span>{check.label}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button type="submit" className="w-full" disabled={!isValid || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...
              </>
            ) : (
              'Start My Journey'
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline underline-offset-4">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
