import { useState } from 'react';
import { analyticsApi } from '@/api';
import { formatCurrency, formatNumber, formatDate } from '@/utils/format';
import useApiResource from '@/hooks/useApiResource';
import useToast from '@/hooks/useToast';
import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/admin/StatCard';
import { ChartCard, RevenueAreaChart, OrderStatusChart, TopProductsChart } from '@/components/admin/Charts';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { ErrorState } from '@/components/ui/States';
import { LoadingBlock } from '@/components/ui/Spinner';
import { truncate, formatDayLabel } from '@/utils/format';

const RANGES = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
  { value: 365, label: 'Last 12 months' },
];

/** Builds a CSV file in the browser from rows already loaded — no extra request. */
const downloadCsv = (filename, headers, rows) => {
  const escape = (value) => {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = [headers.map(escape).join(','), ...rows.map((row) => row.map(escape).join(','))].join('\n');
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const DownloadIcon = (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 4v12M6 10l6 6 6-6" />
    <path d="M4 20h16" />
  </svg>
);

/**
 * Exportable reports built on the analytics endpoints. Each table has a CSV
 * download generated client-side from the same data on screen.
 */
const ReportsPage = () => {
  const toast = useToast();
  const [days, setDays] = useState(30);

  const sales = useApiResource(() => analyticsApi.sales(days), [days]);
  const orders = useApiResource(() => analyticsApi.orders(), []);
  const products = useApiResource(() => analyticsApi.products(20), []);

  if (sales.loading && !sales.data) return <LoadingBlock label="Preparing reports…" />;
  if (sales.error) return <ErrorState title="Could not load reports" error={sales.error} onRetry={sales.reload} />;

  const rangeLabel = RANGES.find((range) => range.value === days)?.label ?? `${days} days`;
  const timeline = sales.data?.timeline ?? [];
  const summary = sales.data?.summary ?? {};
  const byStatus = orders.data?.byStatus ?? [];
  const topProducts = products.data?.topProducts ?? [];
  const stamp = new Date().toISOString().slice(0, 10);

  const exportSales = () => {
    downloadCsv(`sales-${days}d-${stamp}.csv`, ['Date', 'Orders', 'Units', 'Revenue (INR)'], timeline.map((row) => [row.date, row.orders, row.units, row.revenue]));
    toast.success('Sales report downloaded.');
  };
  const exportStatus = () => {
    downloadCsv(`orders-by-status-${stamp}.csv`, ['Status', 'Orders', 'Share (%)', 'Value (INR)'], byStatus.map((row) => [row.status, row.count, row.percentage, row.value]));
    toast.success('Order status report downloaded.');
  };
  const exportProducts = () => {
    downloadCsv(`top-products-${stamp}.csv`, ['Product', 'Units sold', 'Orders', 'Revenue (INR)', 'Stock left'], topProducts.map((row) => [row.name, row.unitsSold, row.orders, row.revenue, row.stock]));
    toast.success('Top products report downloaded.');
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Downloadable summaries built from live order data. Every CSV matches the table on screen."
        actions={
          <Select value={days} onChange={(event) => setDays(Number(event.target.value))} aria-label="Report range" containerClassName="w-44">
            {RANGES.map((range) => <option key={range.value} value={range.value}>{range.label}</option>)}
          </Select>
        }
      />

      <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Revenue" value={formatCurrency(summary.revenue ?? 0)} hint={rangeLabel} tone="success" />
        <StatCard label="Orders" value={formatNumber(summary.orders ?? 0)} hint={`${formatNumber(summary.unitsSold ?? 0)} units`} />
        <StatCard label="Average order" value={formatCurrency(summary.averageOrderValue ?? 0)} tone="neutral" />
        <StatCard label="Tax collected" value={formatCurrency(summary.taxCollected ?? 0)} hint={`Shipping ${formatCurrency(summary.shippingRevenue ?? 0)}`} tone="warning" />
      </div>

      {/* Sales */}
      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Sales report</h2>
            <p className="text-sm text-ink-500">Daily revenue and orders — {rangeLabel.toLowerCase()}.</p>
          </div>
          <Button variant="outline" size="sm" onClick={exportSales} disabled={!timeline.length}>{DownloadIcon} Download CSV</Button>
        </div>
        <div className="mt-4 grid gap-5 xl:grid-cols-5">
          <ChartCard className="xl:col-span-3" title="Revenue over time" subtitle={rangeLabel} isEmpty={timeline.length === 0} emptyMessage="No orders in this range.">
            <RevenueAreaChart data={timeline.map((point) => ({ ...point, label: formatDayLabel(point.date) }))} />
          </ChartCard>
          <div className="xl:col-span-2">
            <DataTable
              dense
              rows={[...timeline].reverse()}
              rowKey={(row) => row.date}
              emptyTitle="No sales in this range"
              columns={[
                { key: 'date', header: 'Date', render: (row) => <span className="text-ink-700">{formatDate(row.date)}</span> },
                { key: 'orders', header: 'Orders' },
                { key: 'units', header: 'Units' },
                { key: 'revenue', header: 'Revenue', className: 'text-right', headerClassName: 'text-right', render: (row) => <span className="font-semibold text-ink-900">{formatCurrency(row.revenue)}</span> },
              ]}
            />
          </div>
        </div>
      </section>

      {/* Orders by status */}
      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Order status report</h2>
            <p className="text-sm text-ink-500">All-time distribution across the workflow.</p>
          </div>
          <Button variant="outline" size="sm" onClick={exportStatus} disabled={!byStatus.length}>{DownloadIcon} Download CSV</Button>
        </div>
        <div className="mt-4 grid gap-5 xl:grid-cols-5">
          <ChartCard className="xl:col-span-2" title="Orders by status" subtitle={`${formatNumber(orders.data?.totalOrders ?? 0)} orders`} isEmpty={(orders.data?.totalOrders ?? 0) === 0}>
            <OrderStatusChart data={byStatus} />
          </ChartCard>
          <div className="xl:col-span-3">
            <DataTable
              dense
              rows={byStatus}
              rowKey={(row) => row.status}
              loading={orders.loading}
              error={orders.error}
              onRetry={orders.reload}
              columns={[
                { key: 'status', header: 'Status', render: (row) => <span className="font-semibold text-ink-900">{row.status}</span> },
                { key: 'count', header: 'Orders' },
                { key: 'percentage', header: 'Share', render: (row) => `${row.percentage}%` },
                { key: 'value', header: 'Value', className: 'text-right', headerClassName: 'text-right', render: (row) => <span className="font-semibold">{formatCurrency(row.value)}</span> },
              ]}
            />
          </div>
        </div>
      </section>

      {/* Top products */}
      <section className="mt-10 mb-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Top products report</h2>
            <p className="text-sm text-ink-500">Best sellers by units, from actual order lines.</p>
          </div>
          <Button variant="outline" size="sm" onClick={exportProducts} disabled={!topProducts.length}>{DownloadIcon} Download CSV</Button>
        </div>
        <div className="mt-4 grid gap-5 xl:grid-cols-5">
          <ChartCard className="xl:col-span-2" title="Units sold" subtitle="Top 8" isEmpty={topProducts.length === 0}>
            <TopProductsChart data={topProducts.slice(0, 8).map((p) => ({ ...p, label: truncate(p.name, 24) }))} />
          </ChartCard>
          <div className="xl:col-span-3">
            <DataTable
              dense
              rows={topProducts}
              rowKey={(row) => row.productId}
              loading={products.loading}
              error={products.error}
              onRetry={products.reload}
              emptyTitle="No sales yet"
              columns={[
                { key: 'name', header: 'Product', render: (row) => <span className="font-medium text-ink-900">{truncate(row.name, 40)}</span> },
                { key: 'unitsSold', header: 'Units' },
                { key: 'orders', header: 'Orders' },
                { key: 'stock', header: 'Stock left' },
                { key: 'revenue', header: 'Revenue', className: 'text-right', headerClassName: 'text-right', render: (row) => <span className="font-semibold">{formatCurrency(row.revenue)}</span> },
              ]}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default ReportsPage;
