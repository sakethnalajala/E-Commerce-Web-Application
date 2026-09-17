import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '@/api';
import { validateEmail } from '@/utils/validators';
import useForm from '@/hooks/useForm';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Alert } from '@/components/ui/States';

const ForgotPasswordPage = () => {
  const [sent, setSent] = useState(false);
  // In development, when SMTP is not configured, the API returns the link so
  // the flow stays testable. It is never returned in production.
  const [devResetUrl, setDevResetUrl] = useState(null);

  const form = useForm({
    initialValues: { email: '' },
    validators: { email: validateEmail },
    onSubmit: async (values) => {
      const response = await authApi.forgotPassword(values);
      setDevResetUrl(response.data?.resetUrl ?? null);
      setSent(true);
    },
  });

  if (sent) {
    return (
      <div className="animate-scale-in">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success-50 text-success-600 ring-8 ring-success-50/60">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
        </span>

        <h1 className="mt-6">Check your inbox</h1>
        <p className="mt-2 leading-relaxed text-ink-500">
          If an account exists for <span className="font-semibold text-ink-800">{form.values.email}</span>, we
          have sent a link to reset the password. It expires in 15 minutes.
        </p>

        {devResetUrl && (
          <Alert tone="warning" title="Development mode" className="mt-5">
            <p>Email delivery is not configured, so here is the reset link directly:</p>
            <Link to={new URL(devResetUrl).pathname} className="mt-2 block break-all font-semibold underline">
              {devResetUrl}
            </Link>
          </Alert>
        )}

        <div className="mt-8 space-y-3">
          <Button to="/login" fullWidth size="lg">Back to log in</Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => {
              setSent(false);
              setDevResetUrl(null);
            }}
          >
            Use a different email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow">Account recovery</p>
      <h1 className="mt-2">Forgot your password?</h1>
      <p className="mt-2 text-ink-500">Enter the email on your account and we will send you a reset link.</p>

      <form onSubmit={form.handleSubmit} className="mt-8 space-y-5" noValidate>
        {form.submitError && <Alert tone="error">{form.submitError}</Alert>}

        <Input label="Email address" type="email" autoComplete="email" placeholder="you@example.com" required {...form.fieldProps('email')} />

        <Button type="submit" size="lg" fullWidth loading={form.submitting}>
          Send reset link
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-500">
        Remembered it?{' '}
        <Link to="/login" className="link">Back to log in</Link>
      </p>
    </div>
  );
};

export default ForgotPasswordPage;
