import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userApi, authApi } from '@/api';
import { formatCurrency, formatDate, initials } from '@/utils/format';
import { validateName, validatePhone, validatePassword, checkoutValidators } from '@/utils/validators';
import useApiResource from '@/hooks/useApiResource';
import useAuth from '@/hooks/useAuth';
import useToast from '@/hooks/useToast';
import useForm from '@/hooks/useForm';
import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/ui/Button';
import Input, { Textarea, Checkbox } from '@/components/ui/Input';
import Modal, { ConfirmDialog } from '@/components/ui/Modal';
import { Alert, EmptyState } from '@/components/ui/States';
import { LoadingBlock } from '@/components/ui/Spinner';
import cn from '@/utils/cn';

const icon = (paths) => (
  <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {paths}
  </svg>
);

const TABS = [
  { id: 'profile', label: 'Profile', icon: icon(<><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>) },
  { id: 'addresses', label: 'Addresses', icon: icon(<><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></>) },
  { id: 'security', label: 'Security', icon: icon(<><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></>) },
];

const StatTile = ({ label, value, hint, to }) => {
  const body = (
    <>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-ink-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-400">{hint}</p>}
    </>
  );
  return to ? (
    <Link to={to} className="card card-hover block p-5">{body}</Link>
  ) : (
    <div className="card p-5">{body}</div>
  );
};

/**
 * Titles per section. The account sidebar (AccountLayout) routes /profile,
 * /addresses and /settings here with a fixed `section`; the page then shows
 * that section only and leaves navigation to the sidebar.
 */
const SECTION_META = {
  profile: { eyebrow: 'Account', title: 'My profile', description: 'Your name, contact details and account overview.' },
  addresses: { eyebrow: 'Account', title: 'Addresses', description: 'Saved delivery addresses used at checkout.' },
  security: { eyebrow: 'Account', title: 'Account settings', description: 'Password, security and preferences for your account.' },
};

const ProfilePage = ({ section }) => {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [tabState, setTab] = useState('profile');
  const tab = section ?? tabState;
  const meta = SECTION_META[tab] ?? SECTION_META.profile;

  const profile = useApiResource(() => userApi.profile(), []);
  const [addresses, setAddresses] = useState([]);
  const [addressModal, setAddressModal] = useState({ open: false, address: null });
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (user?.addresses) setAddresses(user.addresses);
  }, [user]);

  useEffect(() => {
    if (profile.data?.user?.addresses) setAddresses(profile.data.user.addresses);
  }, [profile.data]);

  const profileForm = useForm({
    initialValues: { name: user?.name ?? '', phone: user?.phone ?? '' },
    validators: { name: validateName, phone: (value) => validatePhone(value, { optional: true }) },
    onSubmit: async (values) => {
      const response = await userApi.updateProfile(values);
      updateUser(response.data.user);
      toast.success('Profile updated.');
      await profile.reload();
    },
  });

  const addressForm = useForm({
    initialValues: { label: 'Home', fullName: '', phone: '', addressLine: '', city: '', state: '', postalCode: '', country: 'India', isDefault: false },
    validators: checkoutValidators,
    onSubmit: async (values) => {
      const response = addressModal.address
        ? await userApi.updateAddress(addressModal.address._id, values)
        : await userApi.addAddress(values);
      setAddresses(response.data.addresses);
      updateUser({ ...user, addresses: response.data.addresses });
      toast.success(addressModal.address ? 'Address updated.' : 'Address saved.');
      setAddressModal({ open: false, address: null });
    },
  });

  const openAddressModal = (address = null) => {
    addressForm.reset(
      address ?? {
        label: 'Home',
        fullName: user?.name ?? '',
        phone: user?.phone ?? '',
        addressLine: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        isDefault: addresses.length === 0,
      }
    );
    setAddressModal({ open: true, address });
  };

  const removeAddress = async () => {
    try {
      const response = await userApi.removeAddress(deleteTarget._id);
      setAddresses(response.data.addresses);
      updateUser({ ...user, addresses: response.data.addresses });
      toast.success('Address removed.');
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error.message);
    }
  };

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
      toast.success('Password changed successfully.');
      passwordForm.reset();
    },
  });

  if (profile.loading && !profile.data) return <LoadingBlock label="Loading your account…" />;

  const stats = profile.data?.stats;

  return (
    <div className="min-w-0">
      <PageHeader
        eyebrow={meta.eyebrow}
        title={meta.title}
        description={meta.description}
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Dashboard', to: '/dashboard' }, { label: meta.title }]}
      />

      {/* Identity banner (profile section only) */}
      {tab === 'profile' && (
      <section className="relative mt-6 overflow-hidden rounded-3xl bg-night-400 p-6 text-white noise sm:p-8">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-600/50 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-gradient text-2xl font-bold shadow-glow ring-4 ring-white/10">
            {user?.avatar?.url ? <img src={user.avatar.url} alt="" className="h-full w-full rounded-3xl object-cover" /> : initials(user?.name)}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-white">{user?.name}</h2>
            <p className="text-white/60">{user?.email}</p>
            <p className="mt-1 text-xs text-white/40">Member since {formatDate(user?.createdAt)}</p>
          </div>
          <Button to="/orders" variant="onBrand" className="shrink-0">View my orders</Button>
        </div>
      </section>
      )}

      {tab === 'profile' && stats && (
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <StatTile label="Orders placed" value={stats.totalOrders} to="/orders" />
          <StatTile label="Total spent" value={formatCurrency(stats.totalSpent)} hint="Excludes cancelled orders" />
          <StatTile label="Reviews written" value={stats.totalReviews} />
        </div>
      )}

      <div className={cn('mt-8 grid gap-6', !section && 'lg:grid-cols-[240px,1fr]')}>
        {/* Section nav — hidden when the account sidebar already provides it */}
        {!section && (
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible" aria-label="Account sections">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                'flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all',
                tab === item.id ? 'bg-brand-600 text-white shadow-glow-sm' : 'bg-surface text-ink-600 ring-1 ring-inset ring-ink-200 hover:bg-ink-50'
              )}
              aria-current={tab === item.id ? 'page' : undefined}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          <Link to="/orders" className="flex shrink-0 items-center gap-3 rounded-xl bg-surface px-4 py-3 text-sm font-semibold text-ink-600 ring-1 ring-inset ring-ink-200 transition hover:bg-ink-50">
            {icon(<><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M8 12h8M8 16h5" /></>)}
            Order history
          </Link>
        </nav>
        )}

        <div key={tab} className="animate-fade-up">
          {tab === 'profile' && (
            <form onSubmit={profileForm.handleSubmit} className="card p-6 sm:p-8" noValidate>
              <h3 className="text-base font-bold">Personal details</h3>
              <p className="mt-1 text-sm text-ink-500">Your name appears on orders and reviews.</p>
              {profileForm.submitError && <Alert tone="error" className="mt-4">{profileForm.submitError}</Alert>}

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Input label="Full name" required {...profileForm.fieldProps('name')} />
                <Input label="Phone number" type="tel" {...profileForm.fieldProps('phone')} />
              </div>
              <div className="mt-4">
                <Input label="Email address" value={user?.email ?? ''} disabled hint="Your email is used to sign in and cannot be changed here." />
              </div>

              <div className="mt-6 flex justify-end">
                <Button type="submit" loading={profileForm.submitting}>Save changes</Button>
              </div>
            </form>
          )}

          {tab === 'addresses' && (
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold">Saved addresses</h3>
                  <p className="mt-1 text-sm text-ink-500">Used to fill checkout in one tap.</p>
                </div>
                <Button size="sm" onClick={() => openAddressModal()}>Add address</Button>
              </div>

              {addresses.length === 0 ? (
                <EmptyState
                  compact
                  className="mt-4"
                  title="No saved addresses"
                  description="Save an address to check out faster next time."
                  action={<Button onClick={() => openAddressModal()}>Add your first address</Button>}
                />
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {addresses.map((address) => (
                    <div key={address._id} className={cn('card p-5', address.isDefault && 'border-brand-200 ring-1 ring-brand-200')}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-ink-900">{address.label}</span>
                        {address.isDefault && <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Default</span>}
                      </div>
                      <address className="mt-3 space-y-0.5 text-sm not-italic leading-relaxed text-ink-600">
                        <p className="font-medium text-ink-900">{address.fullName}</p>
                        <p>{address.addressLine}</p>
                        <p>{address.city}, {address.state} {address.postalCode}</p>
                        <p>{address.country}</p>
                        <p className="pt-1 text-ink-500">{address.phone}</p>
                      </address>
                      <div className="mt-4 flex gap-2 border-t border-ink-100 pt-4">
                        <Button variant="outline" size="xs" onClick={() => openAddressModal(address)}>Edit</Button>
                        <Button variant="ghost" size="xs" className="text-danger-600 hover:bg-danger-50" onClick={() => setDeleteTarget(address)}>Remove</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'security' && (
            <form onSubmit={passwordForm.handleSubmit} className="card p-6 sm:p-8" noValidate>
              <h3 className="text-base font-bold">Change password</h3>
              <p className="mt-1 text-sm text-ink-500">Choose a strong password you do not use anywhere else.</p>
              {passwordForm.submitError && <Alert tone="error" className="mt-4">{passwordForm.submitError}</Alert>}

              <div className="mt-5 max-w-md space-y-4">
                <Input label="Current password" type="password" autoComplete="current-password" required {...passwordForm.fieldProps('currentPassword')} />
                <Input label="New password" type="password" autoComplete="new-password" required hint="At least 8 characters with upper and lower case letters and a number." {...passwordForm.fieldProps('newPassword')} />
                <Input label="Confirm new password" type="password" autoComplete="new-password" required {...passwordForm.fieldProps('confirmPassword')} />
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-ink-400">
                  Forgot your current password? <Link to="/forgot-password" className="link">Reset it by email</Link>.
                </p>
                <Button type="submit" loading={passwordForm.submitting}>Update password</Button>
              </div>
            </form>
          )}
        </div>
      </div>

      <Modal
        open={addressModal.open}
        onClose={() => setAddressModal({ open: false, address: null })}
        title={addressModal.address ? 'Edit address' : 'Add a new address'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setAddressModal({ open: false, address: null })}>Cancel</Button>
            <Button onClick={addressForm.handleSubmit} loading={addressForm.submitting}>Save address</Button>
          </>
        }
      >
        <form onSubmit={addressForm.handleSubmit} className="space-y-4" noValidate>
          {addressForm.submitError && <Alert tone="error">{addressForm.submitError}</Alert>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Label" placeholder="Home, Work…" {...addressForm.fieldProps('label')} />
            <Input label="Full name" required {...addressForm.fieldProps('fullName')} />
          </div>
          <Input label="Phone number" type="tel" required {...addressForm.fieldProps('phone')} />
          <Textarea label="Address" rows={3} required {...addressForm.fieldProps('addressLine')} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input label="City" required {...addressForm.fieldProps('city')} />
            <Input label="State" required {...addressForm.fieldProps('state')} />
            <Input label="Postal code" required {...addressForm.fieldProps('postalCode')} />
            <Input label="Country" {...addressForm.fieldProps('country')} />
          </div>
          <Checkbox
            label="Use as my default address"
            checked={Boolean(addressForm.values.isDefault)}
            onChange={(event) => addressForm.setValue('isDefault', event.target.checked)}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={removeAddress}
        title="Remove this address?"
        description="You can always add it again later."
        confirmLabel="Remove address"
      />
    </div>
  );
};

export default ProfilePage;
