import { Link, useParams } from 'react-router-dom';
import { userApi } from '@/api';
import { ROLES } from '@/constants';
import { formatCurrency, formatDate, formatDateTime, initials } from '@/utils/format';
import useApiResource from '@/hooks/useApiResource';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import { ErrorState } from '@/components/ui/States';
import { LoadingBlock } from '@/components/ui/Spinner';

const StatTile = ({ label, value, hint }) => (
  <div className="card p-4">
    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500">{label}</p>
    <p className="mt-2 font-display text-2xl font-bold text-ink-900">{value}</p>
    {hint && <p className="mt-0.5 text-xs text-ink-400">{hint}</p>}
  </div>
);

const AdminUserDetailPage = () => {
  const { id } = useParams();
  const resource = useApiResource(() => userApi.detail(id), [id]);

  if (resource.loading) return <LoadingBlock label="Loading customer…" />;

  if (resource.error) {
    return (
      <div>
        <ErrorState
          title={resource.error.status === 404 ? 'Customer not found' : 'Could not load this customer'}
          error={resource.error}
          onRetry={resource.error.status === 404 ? undefined : resource.reload}
        />
        <div className="mt-6 text-center">
          <Button to="/admin/users" variant="outline">
            Back to customers
          </Button>
        </div>
      </div>
    );
  }

  const { user, stats, recentOrders = [] } = resource.data ?? {};
  if (!user) return null;

  return (
    <div>
      <PageHeader
        back="/admin/users"
        backLabel="Back to customers"
        title={user.name}
        description={user.email}
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'Customers', to: '/admin/users' },
          { label: user.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {user.role === ROLES.ADMIN ? <Badge tone="brand">Admin</Badge> : <Badge>Customer</Badge>}
            {user.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Deactivated</Badge>}
          </div>
        }
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-[320px,1fr]">
        <div className="space-y-5">
          <section className="card p-5">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient text-xl font-bold text-white shadow-glow-sm">
                {user.avatar?.url ? (
                  <img src={user.avatar.url} alt="" className="h-full w-full rounded-2xl object-cover" />
                ) : (
                  initials(user.name)
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-ink-900">{user.name}</p>
                <p className="truncate text-sm text-ink-500">{user.email}</p>
              </div>
            </div>

            <dl className="mt-5 space-y-3 border-t border-ink-200 pt-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">Phone</dt>
                <dd className="font-medium text-ink-900">{user.phone || '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">Joined</dt>
                <dd className="font-medium text-ink-900">{formatDate(user.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">Last login</dt>
                <dd className="font-medium text-ink-900">
                  {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">Saved addresses</dt>
                <dd className="font-medium text-ink-900">{user.addresses?.length ?? 0}</dd>
              </div>
            </dl>
          </section>

          {user.addresses?.length > 0 && (
            <section className="card p-5">
              <h2 className="text-base font-bold">Addresses</h2>
              <ul className="mt-4 space-y-4">
                {user.addresses.map((address) => (
                  <li key={address._id} className="border-b border-ink-100 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink-900">{address.label}</span>
                      {address.isDefault && <Badge tone="neutral">Default</Badge>}
                    </div>
                    <address className="mt-1.5 text-sm not-italic leading-relaxed text-ink-600">
                      {address.fullName}
                      <br />
                      {address.addressLine}
                      <br />
                      {address.city}, {address.state} {address.postalCode}
                      <br />
                      {address.phone}
                    </address>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatTile label="Orders" value={stats?.totalOrders ?? 0} />
            <StatTile
              label="Total spent"
              value={formatCurrency(stats?.totalSpent ?? 0)}
              hint="Excludes cancelled"
            />
            <StatTile label="Reviews" value={stats?.totalReviews ?? 0} />
          </div>

          <section className="card p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold">Recent orders</h2>
              <Button to={`/admin/orders?search=`} variant="ghost" size="sm">
                All orders
              </Button>
            </div>

            <DataTable
              className="mt-4"
              rows={recentOrders}
              emptyTitle="No orders yet"
              emptyDescription="This customer has not placed an order."
              columns={[
                {
                  key: 'orderNumber',
                  header: 'Order',
                  render: (order) => (
                    <Link
                      to={`/admin/orders/${order._id}`}
                      className="whitespace-nowrap font-mono text-sm font-semibold text-brand-700 hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  ),
                },
                {
                  key: 'createdAt',
                  header: 'Placed',
                  render: (order) => <span className="text-ink-600">{formatDate(order.createdAt)}</span>,
                },
                { key: 'totalQuantity', header: 'Items' },
                { key: 'status', header: 'Status', render: (order) => <StatusBadge status={order.status} /> },
                {
                  key: 'totalPrice',
                  header: 'Total',
                  className: 'text-right',
                  headerClassName: 'text-right',
                  render: (order) => (
                    <span className="font-semibold text-ink-900">{formatCurrency(order.totalPrice)}</span>
                  ),
                },
              ]}
              renderMobileCard={(order) => (
                <Link to={`/admin/orders/${order._id}`} className="card block p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="whitespace-nowrap font-mono text-sm font-semibold text-brand-700">{order.orderNumber}</p>
                      <p className="mt-0.5 text-xs text-ink-500">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={order.status} />
                      <p className="mt-1.5 font-semibold">{formatCurrency(order.totalPrice)}</p>
                    </div>
                  </div>
                </Link>
              )}
            />
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetailPage;
