import { Link, useNavigate } from 'react-router-dom';
import { registerValidators } from '@/utils/validators';
import useForm from '@/hooks/useForm';
import useAuth from '@/hooks/useAuth';
import useToast from '@/hooks/useToast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Alert } from '@/components/ui/States';
import SocialLogin from '@/components/common/SocialLogin';
import { HOME_FOR_ROLE } from '@/constants';
import cn from '@/utils/cn';

/** Visual strength meter — the real rules are enforced by the validator. */
const PasswordStrength = ({ value }) => {
  if (!value) return null;

  const checks = [
    { label: '8+ characters', passed: value.length >= 8 },
    { label: 'Lowercase', passed: /[a-z]/.test(value) },
    { label: 'Uppercase', passed: /[A-Z]/.test(value) },
    { label: 'Number', passed: /\d/.test(value) },
  ];

  const score = checks.filter((check) => check.passed).length;
  const tone = ['bg-danger-500', 'bg-danger-500', 'bg-warning-500', 'bg-accent-400', 'bg-success-500'][score];
  const label = ['', 'Weak', 'Fair', 'Good', 'Strong'][score];

  return (
    <div className="mt-2.5 animate-fade-down">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1.5">
          {[0, 1, 2, 3].map((index) => (
            <span key={index} className={cn('h-1.5 flex-1 rounded-full transition-all duration-300', index < score ? tone : 'bg-ink-200')} />
          ))}
        </div>
        <span className="w-12 text-right text-xs font-bold text-ink-600">{label}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {checks.map((check) => (
          <span key={check.label} className={cn('inline-flex items-center gap-1 text-xs transition-colors', check.passed ? 'text-success-600' : 'text-ink-400')}>
            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {check.passed ? <path d="M5 10.5l3.5 3.5L15 7" /> : <circle cx="10" cy="10" r="4" />}
            </svg>
            {check.label}
          </span>
        ))}
      </div>
    </div>
  );
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const toast = useToast();

  const form = useForm({
    initialValues: { name: '', email: '', phone: '', password: '', confirmPassword: '' },
    validators: registerValidators,
    onSubmit: async ({ confirmPassword, ...values }) => {
      const user = await register(values);
      toast.success(`Welcome, ${user.name.split(' ')[0]}! Your account is ready.`);
      navigate(HOME_FOR_ROLE[user.role] ?? '/dashboard', { replace: true });
    },
  });

  /** Google/Apple create the account server-side; the result is a normal signed-in user. */
  const finishSocial = (user) => {
    toast.success(`Welcome, ${user.name.split(' ')[0]}!`);
    navigate(HOME_FOR_ROLE[user.role] ?? '/dashboard', { replace: true });
  };

  return (
    <div>
      <p className="eyebrow">Get started</p>
      <h1 className="mt-2">Create your account</h1>
      <p className="mt-2 text-ink-500">It takes less than a minute, and there is no card required.</p>

      <form onSubmit={form.handleSubmit} className="mt-8 space-y-5" noValidate>
        {form.submitError && <Alert tone="error">{form.submitError}</Alert>}

        <Input label="Full name" autoComplete="name" placeholder="Aarav Sharma" required {...form.fieldProps('name')} />

        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Email address" type="email" autoComplete="email" placeholder="you@example.com" required {...form.fieldProps('email')} />
          <Input label="Phone" type="tel" autoComplete="tel" placeholder="9876543210" hint="Optional" {...form.fieldProps('phone')} />
        </div>

        <div>
          <Input label="Password" type="password" autoComplete="new-password" placeholder="Create a strong password" required {...form.fieldProps('password')} />
          <PasswordStrength value={form.values.password} />
        </div>

        <Input label="Confirm password" type="password" autoComplete="new-password" placeholder="Re-enter your password" required {...form.fieldProps('confirmPassword')} />

        <Button type="submit" size="lg" fullWidth loading={form.submitting}>
          Create account
        </Button>

        <p className="text-center text-xs leading-relaxed text-ink-400">
          By creating an account you agree to our terms of service and privacy policy.
        </p>
      </form>

      <SocialLogin intent="Sign up" className="mt-6" onSuccess={finishSocial} onError={(error) => !/cancelled/i.test(error.message) && form.setSubmitError(error.message)} disabled={form.submitting} />

      <div className="mt-8 flex flex-col items-center gap-2 text-sm text-ink-500 sm:flex-row sm:justify-between">
        <p>
          Already have an account?{' '}
          <Link to="/login" className="link">Log in</Link>
        </p>
        <Link to="/" className="link">Back to store</Link>
      </div>
    </div>
  );
};

export default RegisterPage;
