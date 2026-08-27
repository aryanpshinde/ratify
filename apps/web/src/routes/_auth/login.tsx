import { Link, createFileRoute } from '@tanstack/react-router';
import { LoginForm } from '@/components/auth/login-form';

export const Route = createFileRoute('/_auth/login')({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="flex flex-col items-center gap-4">
      <LoginForm />
      <Link
        to="/signup"
        className="text-body-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Don&apos;t have an account? Sign up
      </Link>
    </div>
  );
}
