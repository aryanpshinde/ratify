import { useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { LoginForm } from './components/auth/login-form';
import { SignupForm } from './components/auth/signup-form';
import { DashboardLayout } from './components/dashboard/dashboard-layout';

function App() {
  const { data: session, isPending } = useSession();
  const [view, setView] = useState<'login' | 'signup'>('login');

  if (isPending) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-body text-muted-foreground">Loading...</p>
      </main>
    );
  }

  if (session) {
    return <DashboardLayout session={session} />;
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-display text-foreground">Ratify</h1>
        <p className="text-body text-muted-foreground">Client delivery portal</p>
      </div>

      {view === 'login' ? (
        <div className="flex flex-col items-center gap-4">
          <LoginForm />
          <button
            type="button"
            className="text-body-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setView('signup')}
          >
            Don't have an account? Sign up
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <SignupForm />
          <button
            type="button"
            className="text-body-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setView('login')}
          >
            Already have an account? Sign in
          </button>
        </div>
      )}
    </main>
  );
}

export default App;
