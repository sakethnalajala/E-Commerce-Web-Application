import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { loginValidators } from '@/utils/validators';
import { DEMO_ACCOUNTS, ROLES } from '@/constants';
import useForm from '@/hooks/useForm';
import useAuth from '@/hooks/useAuth';
import useToast from '@/hooks/useToast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Alert } from '@/components/ui/States';

const ShieldIcon = (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6L12 3Z" />
    <path d="M9.2 12.2l1.9 1.9 3.8-4" />
  </svg>
);

/**
 * Administrator sign-in. Uses the same /auth/login endpoint; the only
 * differences are the surface (no self-registration, no social sign-in) and a
 * role check after login — a customer account is signed straight back out.
 * Admin accounts are created by the seed or by promoting a user in the admin
 * console, never through a public form.
 */
const AdminLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, logout, user, isAuthenticated, isAdmin, initializing } = useAuth();
  const toast = useToast();
  const [demoLoading, setDemoLoading] = useState(false);
  const [copied, setCopied] = useState(null);

  const copyCredential = async (key, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied((current) => (current === key ? null : current)), 1600);
    } catch {
      toast.info('Copy is not available here — select the text instead.');
    }
  };

  const redirectTo = location.state?.from?.pathname;
  const adminRequired = Boolean(location.state?.adminRequired);
  const isDev = import.meta.env.DEV;

  // Non-admin credentials are rejected inside `login` before any session is
  // stored, so the guest-route guard never gets a chance to redirect them.
  const ADMIN_ONLY = { requireRole: ROLES.ADMIN, roleError: 'This account does not have administrator access.' };

  const finish = async (signedIn) => {
    toast.success(`Welcome back, ${signedIn.name.split(' ')[0]}.`);
    navigate(redirectTo && redirectTo.startsWith('/admin') ? redirectTo : '/admin', { replace: true });
  };

  const form = useForm({
    initialValues: { email: '', password: '' },
    validators: loginValidators,
    onSubmit: async (values) => finish(await login(values, ADMIN_ONLY)),
  });

  const useDemoAdmin = async () => {
    if (!DEMO_ACCOUNTS.admin || demoLoading || form.submitting) return;
    form.setSubmitError(null);
    setDemoLoading(true);
    form.setValues(DEMO_ACCOUNTS.admin);
    try {
      await finish(await login(DEMO_ACCOUNTS.admin, ADMIN_ONLY));
    } catch (error) {
      form.setSubmitError(error.message);
    } finally {
      setDemoLoading(false);
    }
  };

  // Already an administrator? Straight to the console.
  if (!initializing && isAuthenticated && isAdmin) {
    return <Navigate to={redirectTo?.startsWith('/admin') ? redirectTo : '/admin'} replace />;
  }

  return (
    <div>
      <span className="inline-flex items-center gap-2 rounded-full bg-night-400 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white">
        {ShieldIcon}
        Admin console
      </span>
      <h1 className="mt-4">Administrator sign in</h1>
      <p className="mt-2 text-ink-500">Manage the catalogue, orders, customers and analytics.</p>

      <Alert tone="info" className="mt-5">
        Admin access is restricted to authorized administrators. There is no self-service registration —
        admin accounts are granted from the console.
      </Alert>

      {isAuthenticated && !isAdmin && (
        <Alert tone="warning" className="mt-3">
          {adminRequired ? 'The admin console needs an administrator account. ' : ''}
          You are signed in as <span className="font-semibold">{user?.name}</span> (customer). Signing in here switches you
          to an administrator session.{' '}
          <Link to="/dashboard" className="font-semibold underline underline-offset-2">Back to my dashboard</Link>
          {' · '}
          <button type="button" onClick={() => logout()} className="font-semibold underline underline-offset-2">Sign out</button>
        </Alert>
      )}

      <form onSubmit={form.handleSubmit} className="mt-6 space-y-5" noValidate>
        {form.submitError && <Alert tone="error">{form.submitError}</Alert>}

        <Input label="Admin email" type="email" autoComplete="username" placeholder="admin@yourstore.com" required {...form.fieldProps('email')} />
        <Input label="Password" type="password" autoComplete="current-password" placeholder="Your password" required {...form.fieldProps('password')} />

        <Button type="submit" size="lg" fullWidth variant="secondary" loading={form.submitting} disabled={demoLoading}>
          {form.submitting ? 'Signing in…' : 'Sign in to the console'}
        </Button>
      </form>

      {isDev && DEMO_ACCOUNTS.admin && (
        <section
          aria-labelledby="demo-admin-heading"
          className="relative mt-6 overflow-hidden rounded-2xl border border-accent-400/60 bg-surface shadow-card"
        >
          {/* Header strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-accent-400/40 bg-gradient-to-r from-accent-50 to-surface px-4 py-3 sm:px-5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-gradient text-[#0b0f1a] shadow-glow-gold">
                <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3 4 6.5v5c0 4.6 3.4 8.4 8 9.5 4.6-1.1 8-4.9 8-9.5v-5L12 3Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </span>
              <div>
                <p id="demo-admin-heading" className="text-sm font-bold text-ink-900">Demo Admin Credentials</p>
                <p className="text-xs text-ink-500">Seeded local account for trying the console.</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-500/40 bg-accent-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-accent-700">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500" aria-hidden="true" />
              Development only
            </span>
          </div>

          {/* Credential rows */}
          <dl className="divide-y divide-ink-100 px-4 sm:px-5">
            {[
              ['Email', DEMO_ACCOUNTS.admin.email, 'email'],
              ['Password', DEMO_ACCOUNTS.admin.password, 'password'],
            ].map(([label, value, key]) => (
              <div key={key} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                <dt className="w-20 shrink-0 text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</dt>
                <dd className="min-w-0 flex-1 select-all break-all rounded-lg bg-ink-50 px-3 py-1.5 font-mono text-[13px] font-semibold text-ink-900">
                  {value}
                </dd>
                <button
                  type="button"
                  onClick={() => copyCredential(key, value)}
                  className="shrink-0 rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-semibold text-ink-600 transition hover:border-ink-300 hover:bg-ink-50 hover:text-ink-900 active:scale-95"
                  aria-label={`Copy demo admin ${label.toLowerCase()}`}
                >
                  {copied === key ? 'Copied' : 'Copy'}
                </button>
              </div>
            ))}
          </dl>

          <div className="px-4 pb-4 sm:px-5 sm:pb-5">
            <Button variant="gold" size="md" fullWidth onClick={useDemoAdmin} loading={demoLoading} disabled={form.submitting}>
              {demoLoading ? 'Signing in…' : 'Sign in with Demo Admin'}
            </Button>
            <p className="mt-2.5 text-center text-[11px] leading-relaxed text-ink-400">
              Values come from <code className="rounded bg-ink-100 px-1 py-0.5 font-mono text-[10px] text-ink-600">VITE_DEMO_*</code> in
              <code className="rounded bg-ink-100 px-1 py-0.5 font-mono text-[10px] text-ink-600">.env.development</code> and are stripped from production builds.
            </p>
          </div>
        </section>
      )}

      <div className="mt-8 flex flex-col items-center gap-2 text-sm text-ink-500 sm:flex-row sm:justify-between">
        <Link to="/login" className="link">Customer login</Link>
        <Link to="/" className="link">Back to store</Link>
      </div>
    </div>
  );
};

export default AdminLoginPage;
