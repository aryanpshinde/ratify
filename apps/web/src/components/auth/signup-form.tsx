import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, type SignupInput } from '@ratify/shared';
import { signUp } from '@/lib/auth-client';
import { JUST_SIGNED_UP_KEY } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function SignupForm() {
  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const { isSubmitting, errors } = form.formState;

  const onSubmit = async (values: SignupInput) => {
    try {
      const res = await signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
      });

      if (res.error) {
        form.setError('root', {
          message: res.error.message || 'Signup failed. Please try again.',
        });
        return;
      }

      sessionStorage.setItem(JUST_SIGNED_UP_KEY, '1');
    } catch {
      form.setError('root', {
        message: 'Network error. Please check your connection and try again.',
      });
    }
  };

  return (
    <Card className="w-full max-w-sm noise-overlay bg-card">
      <CardHeader>
        <CardTitle className="text-h2">Create an account</CardTitle>
        <CardDescription>Enter your details to get started with Ratify</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              aria-invalid={!!errors.name}
              {...form.register('name')}
            />
            {errors.name && <p className="text-sm text-error">{errors.name.message}</p>}
          </div>

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
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...form.register('password')}
            />
            {errors.password && <p className="text-sm text-error">{errors.password.message}</p>}
            <p className="text-caption text-muted-foreground">Must be at least 8 characters.</p>
          </div>

          {errors.root?.message && <p className="text-sm text-error">{errors.root.message}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Sign up'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
