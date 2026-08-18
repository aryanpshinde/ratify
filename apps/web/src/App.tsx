import { LoginForm } from './components/auth/login-form';
import { SignupForm } from './components/auth/signup-form';

function App() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-display text-foreground">Ratify</h1>
        <p className="text-body text-muted-foreground">Client delivery portal</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 w-full justify-center items-start">
        <LoginForm />
        <SignupForm />
      </div>
    </main>
  );
}

export default App;
