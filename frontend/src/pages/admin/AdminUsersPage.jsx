import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { userApi } from '@/api';
import { ADMIN_PAGE_SIZE, ROLES } from '@/constants';
import { formatCurrency, formatDate, initials } from '@/utils/format';
import useApiResource from '@/hooks/useApiResource';
import useDebounce from '@/hooks/useDebounce';
import useAuth from '@/hooks/useAuth';
import useToast from '@/hooks/useToast';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Pagination from '@/components/ui/Pagination';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input, { Select } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/Modal';

const AdminUsersPage = () => {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [active, setActive] = useState('');
  const [page, setPage] = useState(1);
  const [confirmAction, setConfirmAction] = useState(null);
  const [working, setWorking] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const params = useMemo(
    () => ({
      page,
      limit: ADMIN_PAGE_SIZE,
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(role && { role }),
      ...(active !== '' && { isActive: active }),
    }),
    [page, debouncedSearch, role, active]
  );

  const resource = useApiResource(() => userApi.list(params), [params]);
  const users = resource.data?.users ?? [];

  const runAction = async () => {
    setWorking(true);
    try {
      const response = await userApi.update(confirmAction.user._id, confirmAction.payload);
      toast.success(response.message);
      setConfirmAction(null);
      await resource.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setWorking(false);
    }
  };

  const toggleActive = (user) =>
    setConfirmAction({
      user,
      payload: { isActive: !user.isActive },
      title: user.isActive ? `Deactivate ${user.name}?` : `Reactivate ${user.name}?`,
      description: user.isActive
        ? 'They will be logged out and blocked from signing in until reactivated. Their orders and history stay intact.'
        : 'They will be able to sign in and shop again.',
      confirmLabel: user.isActive ? 'Deactivate' : 'Reactivate',
      tone: user.isActive ? 'danger' : 'primary',
    });

  const toggleRole = (user) =>
    setConfirmAction({
      user,
      payload: { role: user.role === ROLES.ADMIN ? ROLES.CUSTOMER : ROLES.ADMIN },
      title: user.role === ROLES.ADMIN ? `Remove admin from ${user.name}?` : `Make ${user.name} an admin?`,
      description:
        user.role === ROLES.ADMIN
          ? 'They lose access to the admin console and keep shopping as a normal customer.'
          : 'Admins can manage products, categories, orders, customers and see all analytics.',
      confirmLabel: 'Confirm',
      tone: 'primary',
    });

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Accounts, spend and order history. Passwords are never exposed by the API."
      />

      <div className="card mt-6 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="Search by name, email or phone…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            aria-label="Search customers"
            containerClassName="lg:col-span-2"
            leadingIcon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.2-3.2" strokeLinecap="round" />
              </svg>
            }
          />

          <Select
            value={role}
            onChange={(event) => {
              setRole(event.target.value);
              setPage(1);
            }}
            aria-label="Filter by role"
          >
            <option value="">All roles</option>
            <option value={ROLES.CUSTOMER}>Customers</option>
            <option value={ROLES.ADMIN}>Admins</option>
          </Select>

          <Select
            value={active}
            onChange={(event) => {
              setActive(event.target.value);
              setPage(1);
            }}
            aria-label="Filter by account status"
          >
            <option value="">Any status</option>
            <option value="true">Active</option>
            <option value="false">Deactivated</option>
          </Select>
        </div>
      </div>

      <DataTable
        className="mt-5"
        loading={resource.loading}
        error={resource.error}
        onRetry={resource.reload}
        rows={users}
        emptyTitle="No customers found"
        emptyDescription="Try a different search term or clear the filters."
        columns={[
          {
            key: 'name',
            header: 'Customer',
            render: (user) => (
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
                  {initials(user.name)}
                </span>
                <div className="min-w-0">
                  <Link to={`/admin/users/${user._id}`} className="block truncate font-medium text-ink-900 hover:text-brand-700">
                    {user.name}
                  </Link>
                  <p className="truncate text-xs text-ink-500">{user.email}</p>
                </div>
              </div>
            ),
          },
          {
            key: 'role',
            header: 'Role',
            render: (user) =>
              user.role === ROLES.ADMIN ? <Badge tone="brand">Admin</Badge> : <Badge>Customer</Badge>,
          },
          { key: 'totalOrders', header: 'Orders' },
          {
            key: 'totalSpent',
            header: 'Spent',
            render: (user) => <span className="font-semibold">{formatCurrency(user.totalSpent)}</span>,
          },
          {
            key: 'createdAt',
            header: 'Joined',
            render: (user) => <span className="text-ink-500">{formatDate(user.createdAt)}</span>,
          },
          {
            key: 'isActive',
            header: 'Status',
            render: (user) =>
              user.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Deactivated</Badge>,
          },
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (user) => {
              const isSelf = user._id === currentUser?._id;

              return (
                <div className="flex justify-end gap-2">
                  <Button to={`/admin/users/${user._id}`} variant="outline" size="xs">
                    View
                  </Button>
                  {!isSelf && (
                    <>
                      <Button variant="ghost" size="xs" onClick={() => toggleRole(user)}>
                        {user.role === ROLES.ADMIN ? 'Demote' : 'Make admin'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        className={user.isActive ? 'text-danger-600' : 'text-success-600'}
                        onClick={() => toggleActive(user)}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </>
                  )}
                </div>
              );
            },
          },
        ]}
        renderMobileCard={(user) => (
          <div className="card p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">
                {initials(user.name)}
              </span>
              <div className="min-w-0 flex-1">
                <Link to={`/admin/users/${user._id}`} className="block truncate font-medium text-ink-900">
                  {user.name}
                </Link>
                <p className="truncate text-xs text-ink-500">{user.email}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {user.role === ROLES.ADMIN ? <Badge tone="brand">Admin</Badge> : <Badge>Customer</Badge>}
                  {user.isActive ? (
                    <Badge tone="success">Active</Badge>
                  ) : (
                    <Badge tone="danger">Deactivated</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3 text-sm">
              <span className="text-ink-500">{user.totalOrders} orders</span>
              <span className="font-semibold text-ink-900">{formatCurrency(user.totalSpent)}</span>
            </div>
          </div>
        )}
      />

      {resource.meta && <Pagination meta={resource.meta} onPageChange={setPage} className="mt-6" />}

      <ConfirmDialog
        open={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        onConfirm={runAction}
        loading={working}
        title={confirmAction?.title}
        description={confirmAction?.description}
        confirmLabel={confirmAction?.confirmLabel}
        tone={confirmAction?.tone === 'danger' ? 'danger' : 'primary'}
      />
    </div>
  );
};

export default AdminUsersPage;
