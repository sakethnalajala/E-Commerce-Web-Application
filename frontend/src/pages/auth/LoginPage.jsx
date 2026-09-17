import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginValidators } from '@/utils/validators';
import { DEMO_ACCOUNTS, HOME_FOR_ROLE } from '@/constants';
import useForm from '@/hooks/useForm';
import useAuth from '@/hooks/useAuth';
import useToast from '@/hooks/useToast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Alert } from '@/components/ui/States';
import SocialLogin from '@/components/common/SocialLogin';

const MailIcon = (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

const LockIcon = (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="10" width="16" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 1 1 8 0v3" />
  </svg>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const toast = useToast();
  const [demoLoading, setDemoLoading] = useState(false);
  const socialBusy = false; // social buttons disable themselves while a popup is open

  // Where the visitor was heading before being asked to log in (protected route).
  const redirectTo = location.state?.from?.pathname;

  const finishLogin = (user) => {
    toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
    // Customers land on their dashboard; admins on the console — unless a
    // protected page sent them here, in which case they go back to it.
    navigate(redirectTo ?? HOME_FOR_ROLE[user.role] ?? '/dashboard', { replace: true });
  };

  const form = useForm({
    initialValues: { email: '', password: '' },
    validators: loginValidators,
    onSubmit: async (values) => finishLogin(await login(values)),
  });

  /** Logs in through the normal /auth/login endpoint with the seeded demo customer. */
  const useDemoAccount = async () => {
    if (!DEMO_ACCOUNTS.customer || demoLoading || form.submitting) return;
    form.setSubmitError(null);
    setDemoLoading(true);
    form.setValues(DEMO_ACCOUNTS.customer);
    try {
      finishLogin(await login(DEMO_ACCOUNTS.customer));
    } catch (error) {
      form.setSubmitError(error.message);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div>
      <p className="eyebrow">Welcome back</p>
      <h1 className="mt-2">Log in to your account</h1>
      <p className="mt-2 text-ink-500">Pick up where you left off — your cart is waiting.</p>

      {redirectTo && (
        <Alert tone="info" className="mt-5">
          Log in to continue to <span className="font-semibold">{redirectTo}</span>.
        </Alert>
      )}

      <form onSubmit={form.handleSubmit} className="mt-8 space-y-5" noValidate>
        {form.submitError && <Alert tone="error">{form.submitError}</Alert>}

        <Input label="Email address" type="email" autoComplete="email" placeholder="you@example.com" leadingIcon={MailIcon} required {...form.fieldProps('email')} />

        <div>
          <Input label="Password" type="password" autoComplete="current-password" placeholder="Your password" leadingIcon={LockIcon} required {...form.fieldProps('password')} />
          <div className="mt-2 text-right">
            <Link to="/forgot-password" className="link text-sm">Forgot password?</Link>
          </div>
        </div>

        <Button type="submit" size="lg" fullWidth loading={form.submitting} disabled={demoLoading || socialBusy}>
          {form.submitting ? 'Signing in…' : 'Log in'}
        </Button>
      </form>

      {DEMO_ACCOUNTS.customer && (
        <section
          aria-labelledby="demo-customer-heading"
          className="relative mt-5 overflow-hidden rounded-2xl border border-brand-200/80 bg-gradient-to-br from-brand-50 via-surface to-accent-50/60 p-4 shadow-soft sm:p-5"
        >
          <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-brand-400/20 blur-2xl" aria-hidden="true" />
          <div className="relative flex items-start gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow-sm">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 20a7 7 0 0 1 14 0" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p id="demo-customer-heading" className="text-[15px] font-bold text-ink-900">Log in as Demo Customer</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-600">
                Explore a ready-made account with seeded orders, addresses and reviews — through the same secure login.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="md"
            fullWidth
            className="relative mt-4"
            onClick={useDemoAccount}
            loading={demoLoading}
            disabled={form.submitting || socialBusy}
          >
            {demoLoading ? 'Signing in…' : 'Continue as Demo Customer'}
          </Button>
        </section>
      )}

      <SocialLogin
        intent="Continue"
        className="mt-6"
        onSuccess={finishLogin}
        onError={(error) => !/cancelled/i.test(error.message) && form.setSubmitError(error.message)}
        disabled={form.submitting || demoLoading}
      />


      <div className="mt-8 flex flex-col items-center gap-2 text-sm text-ink-500 sm:flex-row sm:justify-between">
        <p>
          New here?{' '}
          <Link to="/register" className="link">Create an account</Link>
        </p>
        <Link to="/" className="link">Back to store</Link>
      </div>
    </div>
  );
};

export default LoginPage;
