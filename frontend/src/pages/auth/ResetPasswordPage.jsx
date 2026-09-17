import { Link, useNavigate, useParams } from 'react-router-dom';
import { authApi } from '@/api';
import { validatePassword } from '@/utils/validators';
import useForm from '@/hooks/useForm';
import useToast from '@/hooks/useToast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Alert } from '@/components/ui/States';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const form = useForm({
    initialValues: { password: '', confirmPassword: '' },
    validators: {
      password: (value) => validatePassword(value, 'New password'),
      confirmPassword: (value, values) =>
        !value ? 'Confirm your new password' : value !== values.password ? 'Passwords do not match' : null,
    },
    onSubmit: async (values) => {
      await authApi.resetPassword(token, values);
      toast.success('Password updated. Please log in with your new password.');
      navigate('/login', { replace: true });
    },
  });

  return (
    <div>
      <p className="eyebrow">Almost there</p>
      <h1 className="mt-2">Choose a new password</h1>
      <p className="mt-2 text-ink-500">Pick something you have not used before. Then log in with it.</p>

      <form onSubmit={form.handleSubmit} className="mt-8 space-y-5" noValidate>
        {form.submitError && (
          <Alert tone="error" title="Could not reset your password">
            {form.submitError}
            <Link to="/forgot-password" className="mt-1 block font-semibold underline">Request a new link</Link>
          </Alert>
        )}

        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint="Use upper and lower case letters plus a number."
          required
          {...form.fieldProps('password')}
        />

        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your new password"
          required
          {...form.fieldProps('confirmPassword')}
        />

        <Button type="submit" size="lg" fullWidth loading={form.submitting}>
          Update password
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-500">
        <Link to="/login" className="link">Back to log in</Link>
      </p>
    </div>
  );
};

export default ResetPasswordPage;
