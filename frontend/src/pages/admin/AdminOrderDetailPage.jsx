import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderApi } from '@/api';
import { ORDER_STATUS_FLOW } from '@/constants';
import { formatCurrency, formatDateTime, initials } from '@/utils/format';
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

const AdminOrderDetailPage = () => {
  const { id } = useParams();
  const toast = useToast();
  const resource = useApiResource(() => orderApi.detail(id), [id]);

  const [statusModal, setStatusModal] = useState({ open: false, status: null });
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const order = resource.data?.order;

  const applyStatus = async () => {
    setUpdating(true);
    try {
      const response = await orderApi.updateStatus(id, statusModal.status, note);
      toast.success(response.message);
      setStatusModal({ open: false, status: null });
      setNote('');
      await resource.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUpdating(false);
    }
  };

  if (resource.loading) return <LoadingBlock label="Loading order…" />;

  if (resource.error) {
    return (
      <div>
        <ErrorState
          title={resource.error.status === 404 ? 'Order not found' : 'Could not load this order'}
          error={resource.error}
          onRetry={resource.error.status === 404 ? undefined : resource.reload}
        />
        <div className="mt-6 text-center">
          <Button to="/admin/orders" variant="outline">
            Back to orders
          </Button>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const nextStatuses = ORDER_STATUS_FLOW[order.status] ?? [];

  return (
    <div>
      <PageHeader
        back="/admin/orders"
        backLabel="Back to orders"
        title={order.orderNumber}
        description={`Placed ${formatDateTime(order.createdAt)}`}
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'Orders', to: '/admin/orders' },
          { label: order.orderNumber },
        ]}
        actions={<StatusBadge status={order.status} />}
      />

      {/* Status workflow */}
      <section className="card mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold">Update status</h2>
            <p className="mt-0.5 text-sm text-ink-500">
              {nextStatuses.length
                ? 'Only the transitions allowed by the workflow are offered.'
                : `"${order.status}" is a final status — this order can no longer change.`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {nextStatuses.map((status) => (
              <Button
                key={status}
                variant={status === 'Cancelled' ? 'outline' : 'primary'}
                className={status === 'Cancelled' ? 'text-danger-600' : undefined}
                onClick={() => setStatusModal({ open: true, status })}
              >
                Mark as {status}
              </Button>
            ))}
          </div>
        </div>

        {order.status === 'Cancelled' && (
          <Alert tone="warning" className="mt-4">
            This order was cancelled{order.cancellationReason ? `: ${order.cancellationReason}` : '.'} The
            reserved stock was returned to the catalogue.
          </Alert>
        )}
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr,360px]">
        <div className="space-y-5">
          <section className="card p-5">
            <h2 className="text-base font-bold">
              Items ({order.totalQuantity} units)
            </h2>

            <ul className="mt-4 divide-y divide-ink-100">
              {order.items.map((item, index) => (
                <li key={`${item.product}-${index}`} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-ink-200 bg-ink-100">
                    <ProductImage src={item.image} alt="" compact />
                  </div>

                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/admin/products/${item.product}/edit`}
                      className="block truncate text-sm font-semibold text-ink-900 hover:text-brand-700"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-ink-500">{item.brand}</p>
                    <p className="mt-1 text-sm text-ink-600">
                      {item.quantity} × {formatCurrency(item.price)}
                      {item.originalPrice > item.price && (
                        <span className="ml-2 text-xs text-ink-400 line-through">
                          {formatCurrency(item.originalPrice)}
                        </span>
                      )}
                    </p>
                  </div>

                  <p className="shrink-0 text-sm font-bold text-ink-900">
                    {formatCurrency(item.subtotal)}
                  </p>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-2 border-t border-ink-200 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-600">Items</dt>
                <dd className="font-medium">{formatCurrency(order.itemsPrice)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-600">Shipping</dt>
                <dd className="font-medium">
                  {order.shippingPrice === 0 ? 'Free' : formatCurrency(order.shippingPrice)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-600">Tax</dt>
                <dd className="font-medium">{formatCurrency(order.taxPrice)}</dd>
              </div>
              <div className="flex justify-between border-t border-ink-200 pt-2">
                <dt className="font-semibold text-ink-900">Order total</dt>
                <dd className="text-base font-bold text-ink-900">{formatCurrency(order.totalPrice)}</dd>
              </div>
            </dl>
          </section>

          <section className="card p-5">
            <h2 className="text-base font-bold">Status history</h2>
            <div className="mt-5">
              <OrderTimeline order={order} />
            </div>

            {order.statusHistory?.length > 0 && (
              <ul className="mt-6 space-y-2 border-t border-ink-200 pt-4">
                {order.statusHistory.map((entry, index) => (
                  <li key={index} className="flex flex-wrap items-center gap-2 text-sm text-ink-600">
                    <StatusBadge status={entry.status} />
                    <span className="text-ink-400">{formatDateTime(entry.changedAt)}</span>
                    {entry.changedBy?.name && (
                      <span className="text-ink-500">by {entry.changedBy.name}</span>
                    )}
                    {entry.note && <span className="text-ink-500">— {entry.note}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-5">
          <section className="card p-5">
            <h2 className="text-base font-bold">Customer</h2>

            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">
                {initials(order.user?.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink-900">{order.user?.name ?? 'Deleted user'}</p>
                <p className="truncate text-sm text-ink-500">{order.user?.email}</p>
              </div>
            </div>

            {order.user?.phone && (
              <p className="mt-3 text-sm text-ink-600">Phone: {order.user.phone}</p>
            )}

            {order.user?._id && (
              <Button to={`/admin/users/${order.user._id}`} variant="outline" size="sm" fullWidth className="mt-4">
                View customer profile
              </Button>
            )}
          </section>

          <section className="card p-5">
            <h2 className="text-base font-bold">Shipping address</h2>
            <address className="mt-3 space-y-0.5 text-sm not-italic leading-relaxed text-ink-600">
              <p className="font-medium text-ink-900">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.addressLine}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                {order.shippingAddress.postalCode}
              </p>
              <p>{order.shippingAddress.country}</p>
              <p className="pt-1.5 font-medium text-ink-900">{order.shippingAddress.phone}</p>
            </address>
          </section>

          <section className="card p-5">
            <h2 className="text-base font-bold">Payment</h2>
            <p className="mt-2 text-sm text-ink-600">
              Method: <span className="font-medium text-ink-900">{order.paymentMethod}</span>
            </p>
            <p className="mt-1 text-sm text-ink-600">
              Collected on delivery — no online payment is processed.
            </p>
          </section>
        </div>
      </div>

      <Modal
        open={statusModal.open}
        onClose={() => setStatusModal({ open: false, status: null })}
        title={`Mark order as ${statusModal.status}?`}
        description={
          statusModal.status === 'Cancelled'
            ? 'Cancelling returns every item in this order back to stock.'
            : 'The customer sees this change immediately in their order tracking.'
        }
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setStatusModal({ open: false, status: null })}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              variant={statusModal.status === 'Cancelled' ? 'danger' : 'primary'}
              onClick={applyStatus}
              loading={updating}
            >
              Confirm
            </Button>
          </>
        }
      >
        <Textarea
          label="Note (optional)"
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Added to the order history — e.g. courier name or tracking reference."
        />
      </Modal>
    </div>
  );
};

export default AdminOrderDetailPage;
