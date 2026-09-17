import { Link } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

/**
 * Shown when a signed-in customer opens an admin route. Explains the
 * restriction instead of silently bouncing them, and offers the right exits.
 */
const AccessDeniedPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
        <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-danger-200/50 blur-3xl" aria-hidden="true" />

        <div className="card relative w-full max-w-lg p-8 text-center animate-scale-in sm:p-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-danger-50 text-danger-600 ring-8 ring-danger-50/60">
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 1 1 8 0v3" />
              <path d="M12 14v3" />
            </svg>
          </span>

          <p className="eyebrow mt-6">403 · Restricted</p>
          <h1 className="mt-2">Admin access required</h1>
          <p className="mt-3 text-ink-500">
            You are signed in as <span className="font-semibold text-ink-800">{user?.name}</span> with a customer
            account. The admin console is only available to authorized administrators.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button to="/dashboard" size="lg">Go to my dashboard</Button>
            <Button to="/" variant="outline" size="lg">Back to store</Button>
          </div>

          <p className="mt-6 text-xs text-ink-400">
            Have an administrator account?{' '}
            <button type="button" onClick={logout} className="link">
              Log out
            </button>{' '}
            and use the{' '}
            <Link to="/admin/login" className="link">admin sign-in</Link>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AccessDeniedPage;
