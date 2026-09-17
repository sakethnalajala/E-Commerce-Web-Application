import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '@/api';
import { ORDER_STATUS_LIST, ORDER_STATUS } from '@/constants';
import { formatCurrency, formatDate } from '@/utils/format';
import useApiResource from '@/hooks/useApiResource';
import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { LoadingBlock } from '@/components/ui/Spinner';
import cn from '@/utils/cn';
import ProductImage from '@/components/product/ProductImage';

const FLOW = [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED];

/** Compact 4-step progress strip used on each order card. */
const MiniProgress = ({ status }) => {
  if (status === ORDER_STATUS.CANCELLED) {
    return <div className="h-1.5 w-full rounded-full bg-danger-100"><div className="h-full w-full rounded-full bg-danger-400/70" /></div>;
  }
  const index = FLOW.indexOf(status);
  return (
    <div className="flex gap-1">
      {FLOW.map((step, i) => (
        <span
          key={step}
          className={cn('h-1.5 flex-1 rounded-full transition-colors', i <= index ? 'bg-brand-600' : 'bg-ink-200')}
          title={step}
        />
      ))}
    </div>
  );
};

const OrderCard = ({ order, index }) => (
  <Link
    to={`/orders/${order._id}`}
    className="group card block overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift animate-fade-up"
    style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
  >
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 px-5 py-4">
      <div>
        <p className="whitespace-nowrap font-mono text-sm font-bold text-ink-900">{order.orderNumber}</p>
        <p className="mt-0.5 text-xs text-ink-500">Placed {formatDate(order.createdAt)}</p>
      </div>
      <StatusBadge status={order.status} />
    </div>

    <div className="px-5 py-4">
      <div className="flex items-center gap-2">
        {order.items.slice(0, 4).map((item, i) => (
          <div key={`${item.product}-${i}`} className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-ink-100 bg-ink-100 ring-2 ring-white">
            <ProductImage src={item.image} alt="" compact />
          </div>
        ))}
        {order.items.length > 4 && (
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-ink-100 text-sm font-bold text-ink-500">
            +{order.items.length - 4}
          </span>
        )}
      </div>

      <div className="mt-4">
        <MiniProgress status={order.status} />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-ink-500">{order.totalQuantity} item{order.totalQuantity === 1 ? '' : 's'}</p>
        <div className="flex items-center gap-3">
          <p className="font-display text-lg font-bold text-ink-900">{formatCurrency(order.totalPrice)}</p>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-100 text-ink-500 transition group-hover:bg-brand-600 group-hover:text-white">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </span>
        </div>
      </div>
    </div>
  </Link>
);

const OrdersPage = () => {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const params = useMemo(() => ({ page, limit: 8, ...(status && { status }) }), [page, status]);
  const resource = useApiResource(() => orderApi.myOrders(params), [params]);
  const orders = resource.data?.orders ?? [];

  return (
    <div className="min-w-0">
      <PageHeader
        back="/dashboard"
        backLabel="Back to dashboard"
        eyebrow="Account"
        title="My orders"
        description="Track the status of everything you have ordered."
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Orders' }]}
        actions={<Button to="/profile" variant="outline">Account settings</Button>}
      />

      <div className="scrollbar-none mt-6 flex gap-2 overflow-x-auto pb-1">
        {[{ value: '', label: 'All orders' }, ...ORDER_STATUS_LIST.map((value) => ({ value, label: value }))].map((option) => (
          <button
            key={option.value || 'all'}
            type="button"
            onClick={() => {
              setStatus(option.value);
              setPage(1);
            }}
            className={cn(
              'shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-95',
              status === option.value
                ? 'bg-ink-900 text-surface shadow-soft'
                : 'border border-ink-200 bg-surface text-ink-600 hover:border-ink-300 hover:bg-ink-50'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {resource.loading ? (
          <LoadingBlock label="Loading your orders…" />
        ) : resource.error ? (
          <ErrorState error={resource.error} onRetry={resource.reload} />
        ) : orders.length === 0 ? (
          <EmptyState
            title={status ? `No ${status.toLowerCase()} orders` : 'No orders yet'}
            description={status ? 'Try a different status filter to see your other orders.' : 'Once you place an order it will show up here with live status updates.'}
            action={status ? <Button variant="outline" onClick={() => setStatus('')}>Show all orders</Button> : <Button to="/products" size="lg">Start shopping</Button>}
          />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {orders.map((order, index) => (
                <OrderCard key={order._id} order={order} index={index} />
              ))}
            </div>
            {resource.meta && <Pagination meta={resource.meta} onPageChange={setPage} className="mt-8" />}
          </>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
