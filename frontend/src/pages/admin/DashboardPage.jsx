import { Link } from 'react-router-dom';
import { analyticsApi } from '@/api';
import { formatCurrency, formatCurrencyCompact, formatDate, formatNumber, formatDayLabel, formatMonthLabel, truncate } from '@/utils/format';
import useApiResource from '@/hooks/useApiResource';
import useAuth from '@/hooks/useAuth';
import StatCard, { statIcon } from '@/components/admin/StatCard';
import { ChartCard, RevenueAreaChart, OrderStatusChart, InventoryBreakdown, UserGrowthChart } from '@/components/admin/Charts';
import Button from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import DataTable from '@/components/ui/DataTable';
import { ErrorState } from '@/components/ui/States';
import cn from '@/utils/cn';
import ProductImage from '@/components/product/ProductImage';

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const AttentionCard = ({ to, value, label, tone }) => (
  <Link
    to={to}
    className={cn(
      'group flex items-center gap-4 rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card',
      tone === 'danger' ? 'border-danger-500/20 bg-danger-50' : 'border-warning-500/25 bg-warning-50'
    )}
  >
    <span className={cn('font-display text-3xl font-bold', tone === 'danger' ? 'text-danger-700' : 'text-warning-700')}>{value}</span>
    <span className={cn('text-sm font-semibold', tone === 'danger' ? 'text-danger-700' : 'text-warning-700')}>{label}</span>
    <svg className={cn('ml-auto h-4 w-4 transition-transform group-hover:translate-x-0.5', tone === 'danger' ? 'text-danger-600' : 'text-warning-600')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
  </Link>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const dashboard = useApiResource(() => analyticsApi.dashboard(), []);
  const sales = useApiResource(() => analyticsApi.sales(30), []);
  const orders = useApiResource(() => analyticsApi.orders(), []);
  const inventory = useApiResource(() => analyticsApi.inventory(), []);
  const products = useApiResource(() => analyticsApi.products(5), []);
  const customers = useApiResource(() => analyticsApi.users(6), []);

  const totals = dashboard.data?.totals;
  const recentOrders = dashboard.data?.recentOrders ?? [];
  const revenueSeries = (sales.data?.timeline ?? []).map((point) => ({ ...point, label: formatDayLabel(point.date) }));
  const statusSeries = orders.data?.byStatus ?? [];
  const inventoryTotals = inventory.data?.totals;
  const topProducts = products.data?.topProducts ?? [];
  const customerTotals = customers.data?.totals;
  const growthSeries = (customers.data?.growth ?? []).map((point) => ({ ...point, label: formatMonthLabel(point.month) }));

  if (dashboard.error) {
    return <ErrorState title="Could not load the dashboard" error={dashboard.error} onRetry={dashboard.reload} />;
  }

  const needsAttention = (totals?.lowStockProducts ?? 0) + (totals?.outOfStockProducts ?? 0) + (totals?.pendingOrders ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-3xl bg-night-400 p-6 text-white noise sm:p-8">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand-600/50 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">{formatDate(new Date(), { weekday: 'long' })}</p>
            <h2 className="mt-1.5 text-white">{greeting()}, {user?.name?.split(' ')[0]}</h2>
            <p className="mt-1.5 max-w-xl text-white/65">
              {totals
                ? `${formatNumber(totals.orders)} orders and ${formatCurrencyCompact(totals.revenue)} in revenue so far. ${totals.pendingOrders ? `${totals.pendingOrders} order${totals.pendingOrders === 1 ? '' : 's'} waiting for confirmation.` : 'No orders waiting on you.'}`
                : 'Loading the latest numbers from the database…'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button to="/admin/analytics" variant="onDark">Full analytics</Button>
            <Button to="/admin/products/new" variant="onBrand">Add product</Button>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          label="Total revenue"
          value={formatCurrency(totals?.revenue ?? 0)}
          hint="Excludes cancelled orders"
          loading={dashboard.loading}
          tone="success"
          icon={statIcon(<><path d="M12 2v20" /><path d="M17 6.5A4 4 0 0 0 13 4h-2a3.5 3.5 0 0 0 0 7h2a3.5 3.5 0 0 1 0 7h-2a4 4 0 0 1-4-2.5" /></>)}
        />
        <StatCard
          label="Total orders"
          value={formatNumber(totals?.orders ?? 0)}
          hint="All time"
          loading={dashboard.loading}
          to="/admin/orders"
          icon={statIcon(<><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M8 12h8M8 16h5" /></>)}
        />
        <StatCard
          label="Total customers"
          value={formatNumber(totals?.customers ?? 0)}
          hint={`Avg order ${formatCurrencyCompact(totals?.averageOrderValue ?? 0)}`}
          loading={dashboard.loading}
          to="/admin/users"
          tone="warning"
          icon={statIcon(<><circle cx="9" cy="8" r="3.2" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.5a3 3 0 0 1 0 5.8M17 20a6 6 0 0 0-1.6-4" /></>)}
        />
        <StatCard
          label="Total products"
          value={formatNumber(totals?.products ?? 0)}
          hint={`${totals?.categories ?? 0} categories`}
          loading={dashboard.loading}
          to="/admin/products"
          tone="info"
          icon={statIcon(<><path d="M20 7.5 12 3 4 7.5v9L12 21l8-4.5v-9Z" /><path d="M4 7.5 12 12l8-4.5M12 12v9" /></>)}
        />
        <StatCard
          label="Pending orders"
          value={formatNumber(totals?.pendingOrders ?? 0)}
          hint={totals?.pendingOrders ? 'Waiting for confirmation' : 'Nothing waiting'}
          loading={dashboard.loading}
          to="/admin/orders?status=Pending"
          tone={totals?.pendingOrders ? 'warning' : 'neutral'}
          icon={statIcon(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>)}
        />
        <StatCard
          label="Low stock"
          value={formatNumber(totals?.lowStockProducts ?? 0)}
          hint={`${totals?.outOfStockProducts ?? 0} out of stock`}
          loading={dashboard.loading}
          to="/admin/inventory?filter=low"
          tone={totals?.lowStockProducts || totals?.outOfStockProducts ? 'danger' : 'neutral'}
          icon={statIcon(<><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.8 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.8a2 2 0 0 0-3.4 0Z" /></>)}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-5 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title="Revenue — last 30 days"
          subtitle={sales.data ? `${formatCurrency(sales.data.summary.revenue)} from ${formatNumber(sales.data.summary.orders)} orders` : 'Loading…'}
          isEmpty={!sales.loading && revenueSeries.length === 0}
          emptyMessage="No orders in the last 30 days."
        >
          {sales.loading ? <div className="skeleton h-[280px] rounded-xl" /> : <RevenueAreaChart data={revenueSeries} />}
        </ChartCard>

        <ChartCard
          title="Orders by status"
          subtitle={`${formatNumber(orders.data?.totalOrders ?? 0)} orders in total`}
          isEmpty={!orders.loading && statusSeries.every((entry) => entry.count === 0)}
        >
          {orders.loading ? <div className="skeleton h-[260px] rounded-xl" /> : <OrderStatusChart data={statusSeries} />}
        </ChartCard>
      </div>

      {/* Inventory + recent orders */}
      <div className="grid gap-5 xl:grid-cols-3">
        <ChartCard
          title="Stock health"
          subtitle={inventoryTotals ? `${formatNumber(inventoryTotals.availableInventory)} units · ${formatCurrencyCompact(inventoryTotals.inventoryValue)} at retail` : 'Loading…'}
          action={<Button to="/admin/inventory?filter=low" variant="ghost" size="xs">View issues</Button>}
        >
          {inventory.loading ? (
            <div className="skeleton h-32 rounded-xl" />
          ) : (
            <InventoryBreakdown
              inStock={(inventoryTotals?.totalProducts ?? 0) - (inventoryTotals?.lowStockProducts ?? 0) - (inventoryTotals?.outOfStockProducts ?? 0)}
              lowStock={inventoryTotals?.lowStockProducts ?? 0}
              outOfStock={inventoryTotals?.outOfStockProducts ?? 0}
            />
          )}
        </ChartCard>

        <section className="card p-5 sm:p-6 xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-ink-900">Recent orders</h3>
              <p className="mt-0.5 text-[13px] text-ink-500">The latest activity across the store.</p>
            </div>
            <Button to="/admin/orders" variant="ghost" size="sm">View all</Button>
          </div>

          <DataTable
            className="mt-4"
            dense
            loading={dashboard.loading}
            rows={recentOrders}
            emptyTitle="No orders yet"
            emptyDescription="Orders will appear here as customers check out."
            columns={[
              { key: 'orderNumber', header: 'Order', render: (order) => <Link to={`/admin/orders/${order._id}`} className="whitespace-nowrap font-mono text-[13px] font-bold text-brand-700 hover:underline">{order.orderNumber}</Link> },
              {
                key: 'customer',
                header: 'Customer',
                render: (order) => (
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink-900">{order.user?.name ?? 'Deleted user'}</p>
                    <p className="truncate text-xs text-ink-500">{order.user?.email}</p>
                  </div>
                ),
              },
              { key: 'createdAt', header: 'Placed', render: (order) => <span className="text-ink-600">{formatDate(order.createdAt)}</span> },
              { key: 'status', header: 'Status', render: (order) => <StatusBadge status={order.status} /> },
              { key: 'totalPrice', header: 'Total', className: 'text-right', headerClassName: 'text-right', render: (order) => <span className="font-bold text-ink-900">{formatCurrency(order.totalPrice)}</span> },
            ]}
            renderMobileCard={(order) => (
              <Link to={`/admin/orders/${order._id}`} className="card block p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="whitespace-nowrap font-mono text-[13px] font-bold text-brand-700">{order.orderNumber}</p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-ink-800">{order.user?.name}</p>
                    <p className="text-xs text-ink-500">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusBadge status={order.status} />
                    <p className="mt-1.5 font-bold text-ink-900">{formatCurrency(order.totalPrice)}</p>
                  </div>
                </div>
              </Link>
            )}
          />
        </section>
      </div>

      {/* Top products + customer statistics */}
      <div className="grid gap-5 xl:grid-cols-3">
        <section className="card min-w-0 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-ink-900">Top-selling products</h3>
              <p className="mt-0.5 text-[13px] text-ink-500">By units sold, from paid and fulfilled orders.</p>
            </div>
            <Button to="/admin/reports" variant="ghost" size="sm" className="shrink-0">Report</Button>
          </div>
          {products.loading ? (
            <div className="mt-4 space-y-3">
              {[0, 1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
            </div>
          ) : products.error ? (
            <ErrorState title="Could not load top products" error={products.error} onRetry={products.reload} className="mt-4" />
          ) : topProducts.length === 0 ? (
            <p className="mt-6 rounded-xl bg-ink-50 p-4 text-center text-sm text-ink-500">No product has been sold yet.</p>
          ) : (
            <ol className="mt-4 divide-y divide-ink-100">
              {topProducts.map((product, index) => (
                <li key={product.productId} className="flex items-center gap-3 py-3">
                  <span className="w-5 shrink-0 text-center font-display text-sm font-bold text-ink-400">{index + 1}</span>
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-ink-200 bg-ink-100">
                    <ProductImage src={product.image} alt="" compact />
                  </div>
                  <div className="min-w-0 flex-1">
                    {product.slug ? (
                      <Link to={`/products/${product.slug}`} className="block truncate text-sm font-semibold text-ink-900 hover:text-brand-700">{truncate(product.name, 36)}</Link>
                    ) : (
                      <p className="truncate text-sm font-semibold text-ink-900">{truncate(product.name, 36)}</p>
                    )}
                    <p className="text-xs text-ink-500">{formatNumber(product.unitsSold)} sold · {product.stock} in stock</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-ink-900">{formatCurrencyCompact(product.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <ChartCard
          className="min-w-0 xl:col-span-2"
          title="Customer statistics"
          subtitle={customerTotals ? `${formatNumber(customerTotals.customersWithOrders)} of ${formatNumber(customerTotals.customers)} customers have ordered (${customerTotals.conversionRate}%)` : 'Loading…'}
          action={<Button to="/admin/users" variant="ghost" size="xs">Customers</Button>}
          isEmpty={!customers.loading && !customers.error && growthSeries.length === 0}
          emptyMessage="No sign-ups in the last six months."
        >
          {customers.loading ? (
            <div className="skeleton h-[260px] rounded-xl" />
          ) : customers.error ? (
            <ErrorState title="Could not load customer statistics" error={customers.error} onRetry={customers.reload} />
          ) : (
            <>
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ['Customers', formatNumber(customerTotals?.customers ?? 0)],
                  ['Active accounts', formatNumber(customerTotals?.activeCustomers ?? 0)],
                  ['Have ordered', formatNumber(customerTotals?.customersWithOrders ?? 0)],
                  ['Conversion', `${customerTotals?.conversionRate ?? 0}%`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-ink-50 px-3 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</p>
                    <p className="mt-0.5 font-display text-lg font-bold text-ink-900">{value}</p>
                  </div>
                ))}
              </div>
              <UserGrowthChart data={growthSeries} height={200} />
            </>
          )}
        </ChartCard>
      </div>

      {needsAttention && (
        <section className="card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning-50 text-warning-600">
              {statIcon(<><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.8 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.8a2 2 0 0 0-3.4 0Z" /></>)}
            </span>
            <h3 className="text-base font-bold text-ink-900">Needs your attention</h3>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {totals.pendingOrders > 0 && <AttentionCard to="/admin/orders?status=Pending" value={totals.pendingOrders} label="orders awaiting confirmation" />}
            {totals.lowStockProducts > 0 && <AttentionCard to="/admin/inventory?filter=low" value={totals.lowStockProducts} label="products running low" />}
            {totals.outOfStockProducts > 0 && <AttentionCard to="/admin/inventory?filter=out" value={totals.outOfStockProducts} label="products out of stock" tone="danger" />}
          </div>
        </section>
      )}
    </div>
  );
};

export default DashboardPage;
