import { useState } from 'react';
import { Link } from 'react-router-dom';
import { analyticsApi } from '@/api';
import {
  formatCurrency,
  formatCurrencyCompact,
  formatNumber,
  formatDayLabel,
  formatMonthLabel,
  formatDate,
  truncate,
} from '@/utils/format';
import useApiResource from '@/hooks/useApiResource';
import PageHeader from '@/components/common/PageHeader';
import StatCard, { statIcon } from '@/components/admin/StatCard';
import {
  ChartCard,
  RevenueAreaChart,
  OrderStatusChart,
  CategoryRevenueChart,
  UserGrowthChart,
  TopProductsChart,
  InventoryBreakdown,
  useChartTheme,
} from '@/components/admin/Charts';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Select } from '@/components/ui/Input';
import { ErrorState } from '@/components/ui/States';
import { LoadingBlock } from '@/components/ui/Spinner';
import cn from '@/utils/cn';
import ProductImage from '@/components/product/ProductImage';

const RANGES = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
  { value: 365, label: 'Last 12 months' },
];

const AnalyticsPage = () => {
  const [days, setDays] = useState(30);
  const resource = useApiResource(() => analyticsApi.overview(days), [days]);
  const chart = useChartTheme();

  if (resource.loading && !resource.data) return <LoadingBlock label="Crunching the numbers…" />;

  if (resource.error) {
    return <ErrorState title="Could not load analytics" error={resource.error} onRetry={resource.reload} />;
  }

  const { overview, sales, orders, products, users, inventory } = resource.data ?? {};

  const revenueSeries = (sales?.timeline ?? []).map((point) => ({
    ...point,
    label: formatDayLabel(point.date),
  }));

  const monthlySeries = (sales?.monthly ?? []).map((point) => ({
    ...point,
    label: formatMonthLabel(point.month),
  }));

  const growthSeries = (users?.growth ?? []).map((point) => ({
    ...point,
    label: formatMonthLabel(point.month),
  }));

  const topProductsSeries = (products?.topProducts ?? []).slice(0, 8).map((product) => ({
    ...product,
    label: truncate(product.name, 24),
  }));

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Every figure is computed live from MongoDB — nothing here is hard-coded."
        actions={
          <div className="flex items-center gap-2">
            <Select
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              aria-label="Select date range"
              containerClassName="w-44"
            >
              {RANGES.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </Select>
            <Button variant="outline" onClick={resource.reload} loading={resource.loading}>
              Refresh
            </Button>
          </div>
        }
      />

      {/* 1. Sales & revenue */}
      <section className="mt-6">
        <h2 className="text-lg font-bold">Sales & revenue</h2>

        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Revenue in range"
            value={formatCurrency(sales?.summary.revenue ?? 0)}
            hint={`${RANGES.find((range) => range.value === days)?.label}`}
            tone="success"
            icon={statIcon(<><path d="M12 2v20" /><path d="M17 6.5A4 4 0 0 0 13 4h-2a3.5 3.5 0 0 0 0 7h2a3.5 3.5 0 0 1 0 7h-2a4 4 0 0 1-4-2.5" /></>)}
          />
          <StatCard
            label="Orders in range"
            value={formatNumber(sales?.summary.orders ?? 0)}
            hint={`${formatNumber(sales?.summary.unitsSold ?? 0)} units sold`}
            icon={statIcon(<><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4" /></>)}
          />
          <StatCard
            label="Average order value"
            value={formatCurrency(sales?.summary.averageOrderValue ?? 0)}
            hint="Revenue ÷ orders"
            tone="neutral"
            icon={statIcon(<><path d="M4 19V5" /><path d="M20 19H4" /><path d="M8 16v-5M12 16V8M16 16v-3" /></>)}
          />
          <StatCard
            label="Lifetime revenue"
            value={formatCurrency(overview?.totals.revenue ?? 0)}
            hint={`${formatCurrency(overview?.totals.deliveredRevenue ?? 0)} delivered`}
            tone="warning"
            icon={statIcon(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>)}
          />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <ChartCard
            title="Revenue over time"
            subtitle="Daily revenue from non-cancelled orders"
            isEmpty={revenueSeries.length === 0}
            emptyMessage="No orders were placed in this range."
          >
            <RevenueAreaChart data={revenueSeries} />
          </ChartCard>

          <ChartCard
            title="Monthly revenue"
            subtitle="Rolling 12 months"
            isEmpty={monthlySeries.length === 0}
          >
            <RevenueAreaChart data={monthlySeries} />
          </ChartCard>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Product revenue', value: sales?.summary.itemsRevenue },
            { label: 'Shipping collected', value: sales?.summary.shippingRevenue },
            { label: 'Tax collected', value: sales?.summary.taxCollected },
          ].map((item) => (
            <div key={item.label} className="card p-4">
              <p className="text-sm text-ink-500">{item.label}</p>
              <p className="mt-1 text-xl font-bold text-ink-900">{formatCurrency(item.value ?? 0)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Orders */}
      <section className="mt-10">
        <h2 className="text-lg font-bold">Order statistics</h2>

        <div className="mt-4 grid gap-5 xl:grid-cols-3">
          <ChartCard
            className="xl:col-span-2"
            title="Orders by status"
            subtitle={`${formatNumber(orders?.totalOrders ?? 0)} orders across every status`}
            isEmpty={(orders?.totalOrders ?? 0) === 0}
          >
            <OrderStatusChart data={orders?.byStatus ?? []} />
          </ChartCard>

          <div className="space-y-4">
            <StatCard
              label="Fulfilment rate"
              value={`${orders?.fulfillmentRate ?? 0}%`}
              hint="Share of orders delivered"
              tone="success"
            />
            <StatCard
              label="Cancellation rate"
              value={`${orders?.cancellationRate ?? 0}%`}
              hint="Share of orders cancelled"
              tone="danger"
            />
            <StatCard
              label="Avg time to deliver"
              value={
                orders?.averageDeliveryHours
                  ? `${Math.round(orders.averageDeliveryHours / 24)} days`
                  : '—'
              }
              hint="From order placed to delivered"
              tone="neutral"
            />
          </div>
        </div>

        <div className="card mt-5 p-5">
          <h3 className="text-base font-bold">Status breakdown</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {(orders?.byStatus ?? []).map((entry) => (
              <Link
                key={entry.status}
                to={`/admin/orders?status=${entry.status}`}
                className="rounded-xl border border-ink-200 p-4 transition hover:shadow-card"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ background: chart.status[entry.status] }}
                  />
                  <p className="text-sm font-medium text-ink-600">{entry.status}</p>
                </div>
                <p className="mt-2 text-2xl font-bold text-ink-900">{entry.count}</p>
                <p className="mt-0.5 text-xs text-ink-500">
                  {entry.percentage}% · {formatCurrencyCompact(entry.value)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Products */}
      <section className="mt-10">
        <h2 className="text-lg font-bold">Top-selling products</h2>

        <div className="mt-4 grid gap-5 xl:grid-cols-2">
          <ChartCard
            title="Best sellers by units"
            subtitle="Derived from actual order lines"
            isEmpty={topProductsSeries.length === 0}
          >
            <TopProductsChart data={topProductsSeries} />
          </ChartCard>

          <ChartCard
            title="Revenue by category"
            subtitle="Which categories bring in the money"
            isEmpty={(products?.byCategory ?? []).length === 0}
          >
            <CategoryRevenueChart data={products?.byCategory ?? []} />
          </ChartCard>
        </div>

        <div className="card mt-5 p-5">
          <h3 className="text-base font-bold">Best sellers in detail</h3>
          <DataTable
            className="mt-4"
            rows={products?.topProducts ?? []}
            rowKey={(row) => row.productId}
            emptyTitle="No sales yet"
            emptyDescription="Best sellers appear once orders start coming in."
            columns={[
              {
                key: 'name',
                header: 'Product',
                render: (row) => (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-ink-200 bg-ink-100">
                      <ProductImage src={row.image} alt="" compact />
                    </div>
                    <Link
                      to={`/products/${row.slug ?? row.productId}`}
                      className="min-w-0 font-medium text-ink-900 hover:text-brand-700"
                    >
                      {truncate(row.name, 46)}
                    </Link>
                  </div>
                ),
              },
              { key: 'unitsSold', header: 'Units sold', render: (row) => formatNumber(row.unitsSold) },
              { key: 'orders', header: 'Orders', render: (row) => formatNumber(row.orders) },
              {
                key: 'stock',
                header: 'Stock left',
                render: (row) => (
                  <span className={cn('font-medium', row.stock <= 0 ? 'text-danger-600' : row.stock <= 10 ? 'text-warning-600' : 'text-ink-700')}>
                    {formatNumber(row.stock)}
                  </span>
                ),
              },
              {
                key: 'revenue',
                header: 'Revenue',
                className: 'text-right',
                headerClassName: 'text-right',
                render: (row) => (
                  <span className="font-semibold text-ink-900">{formatCurrency(row.revenue)}</span>
                ),
              },
            ]}
          />
        </div>
      </section>

      {/* 4. Customers */}
      <section className="mt-10">
        <h2 className="text-lg font-bold">Customer statistics</h2>

        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total customers" value={formatNumber(users?.totals.customers ?? 0)} />
          <StatCard
            label="Active accounts"
            value={formatNumber(users?.totals.activeCustomers ?? 0)}
            tone="success"
          />
          <StatCard
            label="Customers who ordered"
            value={formatNumber(users?.totals.customersWithOrders ?? 0)}
            tone="neutral"
          />
          <StatCard
            label="Conversion rate"
            value={`${users?.totals.conversionRate ?? 0}%`}
            hint="Customers with at least one order"
            tone="warning"
          />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <ChartCard
            title="New customers per month"
            subtitle="Registrations over the last 6 months"
            isEmpty={growthSeries.length === 0}
          >
            <UserGrowthChart data={growthSeries} />
          </ChartCard>

          <div className="card p-5">
            <h3 className="text-base font-bold">Highest-value customers</h3>
            <DataTable
              className="mt-4"
              rows={users?.topCustomers ?? []}
              rowKey={(row) => row.userId}
              emptyTitle="No customer spend yet"
              columns={[
                {
                  key: 'name',
                  header: 'Customer',
                  render: (row) => (
                    <Link to={`/admin/users/${row.userId}`} className="min-w-0">
                      <p className="font-medium text-ink-900 hover:text-brand-700">{row.name}</p>
                      <p className="truncate text-xs text-ink-500">{row.email}</p>
                    </Link>
                  ),
                },
                { key: 'orders', header: 'Orders' },
                {
                  key: 'lastOrderAt',
                  header: 'Last order',
                  render: (row) => <span className="text-ink-600">{formatDate(row.lastOrderAt)}</span>,
                },
                {
                  key: 'totalSpent',
                  header: 'Spent',
                  className: 'text-right',
                  headerClassName: 'text-right',
                  render: (row) => (
                    <span className="font-semibold text-ink-900">{formatCurrency(row.totalSpent)}</span>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </section>

      {/* 5. Inventory */}
      <section className="mt-10 mb-4">
        <h2 className="text-lg font-bold">Product & stock insights</h2>

        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total products" value={formatNumber(inventory?.totals.totalProducts ?? 0)} />
          <StatCard
            label="Available inventory"
            value={formatNumber(inventory?.totals.availableInventory ?? 0)}
            hint={`Worth ${formatCurrencyCompact(inventory?.totals.inventoryValue ?? 0)}`}
            tone="success"
          />
          <StatCard
            label="Low stock"
            value={formatNumber(inventory?.totals.lowStockProducts ?? 0)}
            hint={`At or below ${inventory?.lowStockThreshold ?? 10} units`}
            tone="warning"
          />
          <StatCard
            label="Out of stock"
            value={formatNumber(inventory?.totals.outOfStockProducts ?? 0)}
            hint="Hidden from customers' add-to-cart"
            tone="danger"
          />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-3">
          <ChartCard title="Stock health" subtitle="Share of the catalogue by stock state">
            <InventoryBreakdown
              inStock={
                (inventory?.totals.totalProducts ?? 0) -
                (inventory?.totals.lowStockProducts ?? 0) -
                (inventory?.totals.outOfStockProducts ?? 0)
              }
              lowStock={inventory?.totals.lowStockProducts ?? 0}
              outOfStock={inventory?.totals.outOfStockProducts ?? 0}
            />
          </ChartCard>

          <div className="card p-5 xl:col-span-2">
            <h3 className="text-base font-bold">Restock priority</h3>
            <p className="mt-0.5 text-sm text-ink-500">
              Out of stock first, then whatever is running low.
            </p>

            <DataTable
              className="mt-4"
              rows={[...(inventory?.outOfStock ?? []), ...(inventory?.lowStock ?? [])].slice(0, 10)}
              emptyTitle="Everything is well stocked"
              emptyDescription="No products are low or out of stock right now."
              columns={[
                {
                  key: 'name',
                  header: 'Product',
                  render: (row) => (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-ink-200 bg-ink-100">
                        {row.images?.[0]?.url && (
                          <ProductImage src={row.images?.[0]} alt="" compact />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink-900">{truncate(row.name, 40)}</p>
                        <p className="text-xs text-ink-500">{row.category?.name ?? 'Uncategorized'}</p>
                      </div>
                    </div>
                  ),
                },
                { key: 'brand', header: 'Brand' },
                {
                  key: 'stock',
                  header: 'Stock',
                  render: (row) =>
                    row.stock <= 0 ? (
                      <Badge tone="danger">Out of stock</Badge>
                    ) : (
                      <Badge tone="warning">{row.stock} left</Badge>
                    ),
                },
                {
                  key: 'action',
                  header: '',
                  className: 'text-right',
                  render: (row) => (
                    <Button to={`/admin/products/${row._id}/edit`} variant="outline" size="xs">
                      Restock
                    </Button>
                  ),
                },
              ]}
            />
          </div>
        </div>

        <div className="card mt-5 p-5">
          <h3 className="text-base font-bold">Inventory by category</h3>
          <DataTable
            className="mt-4"
            rows={inventory?.byCategory ?? []}
            rowKey={(row) => row.category}
            emptyTitle="No categories yet"
            columns={[
              { key: 'category', header: 'Category', render: (row) => <span className="font-medium text-ink-900">{row.category}</span> },
              { key: 'products', header: 'Products', render: (row) => formatNumber(row.products) },
              { key: 'stock', header: 'Units in stock', render: (row) => formatNumber(row.stock) },
              {
                key: 'inventoryValue',
                header: 'Retail value',
                className: 'text-right',
                headerClassName: 'text-right',
                render: (row) => (
                  <span className="font-semibold text-ink-900">{formatCurrency(row.inventoryValue)}</span>
                ),
              },
            ]}
          />
        </div>
      </section>
    </div>
  );
};

export default AnalyticsPage;
