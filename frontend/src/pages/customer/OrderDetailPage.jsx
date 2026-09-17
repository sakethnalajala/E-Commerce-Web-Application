import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { orderApi } from '@/api';
import { ORDER_STATUS } from '@/constants';
import { formatCurrency, formatDateTime } from '@/utils/format';
import useApiResource from '@/hooks/useApiResource';
import useToast from '@/hooks/useToast';
import PageHeader from '@/components/common/PageHeader';
import OrderTimeline from '@/components/common/OrderTimeline';
import Button from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import { Alert, ErrorState } from '@/components/ui/States';
import { LoadingBlock } from '@/components/ui/Spinner';
import ProductImage from '@/components/product/ProductImage';

const CANCELLABLE = [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED];

const SummaryRow = ({ label, value, strong }) => (
  <div className="flex justify-between gap-4 text-sm">
    <dt className={strong ? 'font-bold text-ink-900' : 'text-ink-600'}>{label}</dt>
    <dd className={strong ? 'font-display text-lg font-bold text-ink-900' : 'font-semibold text-ink-900'}>{value}</dd>
  </div>
);

const OrderDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const toast = useToast();

  const resource = useApiResource(() => orderApi.detail(id), [id]);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const order = resource.data?.order;

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await orderApi.cancel(id, reason);
      toast.success('Your order was cancelled.');
      setCancelOpen(false);
      setReason('');
      await resource.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCancelling(false);
    }
  };

  if (resource.loading) return <LoadingBlock label="Loading order…" className="min-h-[60vh]" />;

  if (resource.error) {
    return (
      <div className="min-w-0 py-4">
        <ErrorState
          title={resource.error.status === 404 ? 'Order not found' : resource.error.status === 403 ? 'You cannot view this order' : 'Could not load this order'}
          error={resource.error.status === 403 ? 'This order belongs to another account.' : resource.error}
          onRetry={[403, 404].includes(resource.error.status) ? undefined : resource.reload}
        />
        <div className="mt-6 text-center">
          <Button to="/orders" variant="outline">Back to my orders</Button>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-w-0">
      {location.state?.justPlaced && (
        <div className="mb-6 overflow-hidden rounded-3xl bg-brand-gradient p-6 text-white shadow-glow animate-scale-in sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            </span>
            <div>
              <h2 className="text-white">Thank you — your order is in!</h2>
              <p className="mt-1 text-white/80">We have started preparing it. Track every step right here, any time.</p>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        back="/orders"
        backLabel="Back to my orders"
        eyebrow="Order"
        title={order.orderNumber}
        description={`Placed on ${formatDateTime(order.createdAt)}`}
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'My orders', to: '/orders' }, { label: order.orderNumber }]}
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} size="md" />
            {CANCELLABLE.includes(order.status) && (
              <Button variant="outline" className="text-danger-600 hover:bg-danger-50" onClick={() => setCancelOpen(true)}>
                Cancel order
              </Button>
            )}
          </div>
        }
      />

      <section className="card mt-8 p-6 sm:p-8">
        <h2 className="text-base font-bold">Order progress</h2>
        <div className="mt-6">
          <OrderTimeline order={order} />
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr,360px]">
        <section className="card p-6">
          <h2 className="text-base font-bold">Items · {order.totalQuantity}</h2>
          <ul className="mt-4 divide-y divide-ink-100">
            {order.items.map((item, index) => (
              <li key={`${item.product}-${index}`} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                <Link to={`/products/${item.product}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-ink-100 bg-ink-100">
                  <ProductImage src={item.image} alt="" compact />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">{item.brand}</p>
                  <Link to={`/products/${item.product}`} className="mt-0.5 block text-[15px] font-semibold text-ink-900 hover:text-brand-700">
                    {item.name}
                  </Link>
                  <p className="mt-1 text-sm text-ink-500">
                    {item.quantity} × {formatCurrency(item.price)}
                    {item.originalPrice > item.price && <span className="ml-2 text-xs text-ink-400 line-through">{formatCurrency(item.originalPrice)}</span>}
                  </p>
                </div>
                <p className="shrink-0 font-display text-base font-bold text-ink-900">{formatCurrency(item.subtotal)}</p>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="text-base font-bold">Payment summary</h2>
            <dl className="mt-4 space-y-3">
              <SummaryRow label="Items" value={formatCurrency(order.itemsPrice)} />
              <SummaryRow label="Shipping" value={order.shippingPrice === 0 ? 'Free' : formatCurrency(order.shippingPrice)} />
              <SummaryRow label="Tax" value={formatCurrency(order.taxPrice)} />
              <div className="border-t border-dashed border-ink-200 pt-3">
                <SummaryRow label="Total" value={formatCurrency(order.totalPrice)} strong />
              </div>
            </dl>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-ink-50 px-3.5 py-2.5 text-sm text-ink-600">
              <svg className="h-4 w-4 text-ink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></svg>
              {order.paymentMethod}
            </div>
          </section>

          <section className="card p-6">
            <h2 className="text-base font-bold">Delivering to</h2>
            <address className="mt-3 space-y-0.5 text-sm not-italic leading-relaxed text-ink-600">
              <p className="font-semibold text-ink-900">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.addressLine}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
              <p>{order.shippingAddress.country}</p>
              <p className="pt-2 font-medium text-ink-800">{order.shippingAddress.phone}</p>
            </address>
          </section>

          <Button to="/products" variant="outline" fullWidth>Continue shopping</Button>
        </div>
      </div>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel this order?"
        description="The reserved stock goes straight back to the catalogue. This cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={cancelling}>Keep order</Button>
            <Button variant="danger" onClick={handleCancel} loading={cancelling}>Cancel order</Button>
          </>
        }
      >
        <Textarea label="Reason (optional)" rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Let us know why, so we can improve." />
      </Modal>
    </div>
  );
};

export default OrderDetailPage;
