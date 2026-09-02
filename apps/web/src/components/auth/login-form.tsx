import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@ratify/shared';
import { signIn } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function LoginForm() {
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { isSubmitting, errors } = form.formState;

  const onSubmit = async (values: LoginInput) => {
    try {
      const res = await signIn.email({
        email: values.email,
        password: values.password,
      });

      if (res.error) {
        form.setError('root', {
          message: res.error.message || 'Invalid email or password. Please try again.',
        });
        return;
      }
    } catch {
      form.setError('root', {
        message: 'Network error. Please check your connection and try again.',
      });
    }
  };

  return (
    <Card className="w-full max-w-sm noise-overlay bg-card">
      <CardHeader>
        <CardTitle className="text-h2">Welcome back</CardTitle>
        <CardDescription>Sign in to your Ratify account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              {...form.register('email')}
            />
            {errors.email && <p className="text-sm text-error">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...form.register('password')}
            />
            {errors.password && <p className="text-sm text-error">{errors.password.message}</p>}
          </div>

          {errors.root?.message && <p className="text-sm text-error">{errors.root.message}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
