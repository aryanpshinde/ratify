import { Link, createFileRoute } from '@tanstack/react-router';
import { SignupForm } from '@/components/auth/signup-form';

export const Route = createFileRoute('/_auth/signup')({
  component: SignupPage,
});

function SignupPage() {
  return (
    <div className="flex flex-col items-center gap-4">
      <SignupForm />
      <Link
        to="/login"
        className="text-body-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Already have an account? Sign in
      </Link>
    </div>
  );
}
