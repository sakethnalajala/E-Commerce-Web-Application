import { userApi, authApi } from '@/api';
import { formatDate, formatDateTime, initials } from '@/utils/format';
import { validateName, validatePhone, validatePassword } from '@/utils/validators';
import useAuth from '@/hooks/useAuth';
import useToast from '@/hooks/useToast';
import useForm from '@/hooks/useForm';
import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { Alert } from '@/components/ui/States';

/** The administrator's own account — same profile and password endpoints as customers. */
const AdminProfilePage = () => {
  const { user, updateUser, logout } = useAuth();
  const toast = useToast();

  const profileForm = useForm({
    initialValues: { name: user?.name ?? '', phone: user?.phone ?? '' },
    validators: { name: validateName, phone: (value) => validatePhone(value, { optional: true }) },
    onSubmit: async (values) => {
      const response = await userApi.updateProfile(values);
      updateUser(response.data.user);
      toast.success('Profile updated.');
    },
  });

  const passwordForm = useForm({
    initialValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    validators: {
      currentPassword: (value) => (value ? null : 'Current password is required'),
      newPassword: (value, values) => {
        const message = validatePassword(value, 'New password');
        if (message) return message;
        if (value === values.currentPassword) return 'Choose a password different from the current one';
        return null;
      },
      confirmPassword: (value, values) => (value !== values.newPassword ? 'Passwords do not match' : null),
    },
    onSubmit: async ({ currentPassword, newPassword }) => {
      await authApi.changePassword({ currentPassword, newPassword });
      toast.success('Password changed. Other sessions have been signed out.');
      passwordForm.reset();
    },
  });

  return (
    <div>
      <PageHeader title="Admin profile" description="Your administrator account. Role changes are made from the Customers page by another admin." />

      <section className="relative mt-6 overflow-hidden rounded-3xl bg-night-400 p-6 text-white noise sm:p-8">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-600/50 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-gradient text-2xl font-bold shadow-glow ring-4 ring-white/10">{initials(user?.name)}</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-white">{user?.name}</h2>
              <Badge tone="dark">Administrator</Badge>
            </div>
            <p className="text-white/60">{user?.email}</p>
            <p className="mt-1 text-xs text-white/40">
              Admin since {formatDate(user?.createdAt)}{user?.lastLoginAt ? ` · last sign-in ${formatDateTime(user.lastLoginAt)}` : ''}
            </p>
          </div>
          <Button variant="onDark" onClick={logout} className="shrink-0">Log out</Button>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form onSubmit={profileForm.handleSubmit} className="card p-6" noValidate>
          <h3 className="text-base font-bold">Personal details</h3>
          <p className="mt-1 text-sm text-ink-500">Shown on order status history entries you make.</p>
          {profileForm.submitError && <Alert tone="error" className="mt-4">{profileForm.submitError}</Alert>}
          <div className="mt-5 space-y-4">
            <Input label="Full name" required {...profileForm.fieldProps('name')} />
            <Input label="Phone number" type="tel" {...profileForm.fieldProps('phone')} />
            <Input label="Email address" value={user?.email ?? ''} disabled hint="Used to sign in; cannot be changed here." />
          </div>
          <div className="mt-6 flex justify-end">
            <Button type="submit" loading={profileForm.submitting}>Save changes</Button>
          </div>
        </form>

        <form onSubmit={passwordForm.handleSubmit} className="card p-6" noValidate>
          <h3 className="text-base font-bold">Change password</h3>
          <p className="mt-1 text-sm text-ink-500">Tokens issued before the change are revoked automatically.</p>
          {passwordForm.submitError && <Alert tone="error" className="mt-4">{passwordForm.submitError}</Alert>}
          <div className="mt-5 space-y-4">
            <Input label="Current password" type="password" autoComplete="current-password" required {...passwordForm.fieldProps('currentPassword')} />
            <Input label="New password" type="password" autoComplete="new-password" required hint="8+ characters with upper and lower case letters and a number." {...passwordForm.fieldProps('newPassword')} />
            <Input label="Confirm new password" type="password" autoComplete="new-password" required {...passwordForm.fieldProps('confirmPassword')} />
          </div>
          <div className="mt-6 flex justify-end">
            <Button type="submit" variant="secondary" loading={passwordForm.submitting}>Update password</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProfilePage;
