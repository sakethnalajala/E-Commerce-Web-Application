import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { orderApi } from '@/api';
import { ADMIN_PAGE_SIZE, ORDER_STATUS_LIST } from '@/constants';
import { formatCurrency, formatDateTime } from '@/utils/format';
import useApiResource from '@/hooks/useApiResource';
import useDebounce from '@/hooks/useDebounce';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Pagination from '@/components/ui/Pagination';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import { useChartTheme } from '@/components/admin/Charts';
import cn from '@/utils/cn';

const AdminOrdersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get('status') ?? '';
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 400);

  const params = useMemo(
    () => ({
      page,
      limit: ADMIN_PAGE_SIZE,
      ...(status && { status }),
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(from && { from }),
      ...(to && { to }),
    }),
    [page, status, debouncedSearch, from, to]
  );

  const resource = useApiResource(() => orderApi.listAll(params), [params]);
  const chart = useChartTheme();

  const orders = resource.data?.orders ?? [];
  const statusCounts = resource.data?.statusCounts ?? {};

  const setStatus = (next) => {
    setPage(1);
    setSearchParams(next ? { status: next } : {}, { replace: true });
  };

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Every order placed in the store, with full customer and shipping details."
      />

      {/* Status tabs */}
      <div className="scrollbar-none mt-6 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setStatus('')}
          className={cn(
            'shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all active:scale-95',
            status === '' ? 'bg-ink-900 text-surface shadow-soft' : 'border border-ink-200 bg-surface text-ink-600 hover:border-ink-300 hover:bg-ink-50'
          )}
        >
          All orders
          <span className="ml-1.5 text-xs opacity-70">
            {Object.values(statusCounts).reduce((sum, count) => sum + count, 0)}
          </span>
        </button>

        {ORDER_STATUS_LIST.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatus(value)}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all active:scale-95',
              status === value
                ? 'bg-ink-900 text-surface shadow-soft'
                : 'border border-ink-200 bg-surface text-ink-600 hover:border-ink-300 hover:bg-ink-50'
            )}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: chart.status[value] }} />
            {value}
            <span className="text-xs opacity-70">{statusCounts[value] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card mt-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="Search by order number…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            aria-label="Search orders"
            containerClassName="lg:col-span-2"
            leadingIcon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.2-3.2" strokeLinecap="round" />
              </svg>
            }
          />
          <Input
            type="date"
            label=""
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              setPage(1);
            }}
            aria-label="From date"
          />
          <Input
            type="date"
            value={to}
            onChange={(event) => {
              setTo(event.target.value);
              setPage(1);
            }}
            aria-label="To date"
          />
        </div>

        {(search || from || to) && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setFrom('');
              setTo('');
              setPage(1);
            }}
            className="mt-3 text-sm font-medium text-ink-500 hover:text-ink-800"
          >
            Reset filters
          </button>
        )}
      </div>

      <DataTable
        className="mt-5"
        loading={resource.loading}
        error={resource.error}
        onRetry={resource.reload}
        rows={orders}
        emptyTitle={status ? `No ${status.toLowerCase()} orders` : 'No orders yet'}
        emptyDescription="Orders appear here as soon as customers check out."
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
            key: 'customer',
            header: 'Customer',
            render: (order) => (
              <div className="min-w-0">
                <p className="truncate font-medium text-ink-900">{order.user?.name ?? 'Deleted user'}</p>
                <p className="truncate text-xs text-ink-500">{order.user?.email}</p>
              </div>
            ),
          },
          {
            key: 'createdAt',
            header: 'Placed',
            render: (order) => <span className="text-ink-600">{formatDateTime(order.createdAt)}</span>,
          },
          {
            key: 'items',
            header: 'Items',
            render: (order) => <span className="text-ink-600">{order.totalQuantity}</span>,
          },
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
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (order) => (
              <Button to={`/admin/orders/${order._id}`} variant="outline" size="xs">
                Manage
              </Button>
            ),
          },
        ]}
        renderMobileCard={(order) => (
          <Link to={`/admin/orders/${order._id}`} className="card block p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="whitespace-nowrap font-mono text-sm font-semibold text-brand-700">{order.orderNumber}</p>
                <p className="mt-1 truncate text-sm font-medium text-ink-900">{order.user?.name}</p>
                <p className="truncate text-xs text-ink-500">{order.user?.email}</p>
                <p className="mt-1 text-xs text-ink-500">{formatDateTime(order.createdAt)}</p>
              </div>
              <div className="shrink-0 text-right">
                <StatusBadge status={order.status} />
                <p className="mt-2 font-bold text-ink-900">{formatCurrency(order.totalPrice)}</p>
                <p className="text-xs text-ink-500">{order.totalQuantity} items</p>
              </div>
            </div>
          </Link>
        )}
      />

      {resource.meta && <Pagination meta={resource.meta} onPageChange={setPage} className="mt-6" />}
    </div>
  );
};

export default AdminOrdersPage;
