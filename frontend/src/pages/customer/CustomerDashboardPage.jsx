import { Link } from 'react-router-dom';
import { userApi, orderApi, reviewApi } from '@/api';
import { ORDER_STATUS } from '@/constants';
import { formatCurrency, formatDate, formatRelativeTime, initials } from '@/utils/format';
import useApiResource from '@/hooks/useApiResource';
import useAuth from '@/hooks/useAuth';
import useCart from '@/hooks/useCart';
import Button from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Rating } from '@/components/ui/Rating';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Reveal } from '@/components/common/Motion';
import cn from '@/utils/cn';
import ProductImage from '@/components/product/ProductImage';

const icon = (paths, className = 'h-5 w-5') => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {paths}
  </svg>
);

const QUICK_LINKS = [
  { to: '/products', label: 'Shop', text: 'Browse the catalogue', icon: icon(<><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.2-3.2" /></>), tone: 'bg-brand-50 text-brand-600' },
  { to: '/cart', label: 'Cart', text: 'Review your bag', icon: icon(<><path d="M4 6h16l-1.2 9.6a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.7L4 6Z" /><circle cx="9" cy="20" r="1.2" /><circle cx="17" cy="20" r="1.2" /></>), tone: 'bg-accent-100 text-accent-700' },
  { to: '/orders', label: 'Orders', text: 'Track deliveries', icon: icon(<><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M8 12h8M8 16h5" /></>), tone: 'bg-info-50 text-info-600' },
  { to: '/profile', label: 'Profile', text: 'Details & addresses', icon: icon(<><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>), tone: 'bg-success-50 text-success-600' },
];

const StatTile = ({ label, value, hint, to, delay = 0 }) => {
  const body = (
    <>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-ink-900 sm:text-3xl">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-400">{hint}</p>}
    </>
  );
  return (
    <Reveal delay={delay}>
      {to ? <Link to={to} className="card card-hover block h-full p-5">{body}</Link> : <div className="card h-full p-5">{body}</div>}
    </Reveal>
  );
};

const ACTIVE_STATUSES = [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.SHIPPED];

/**
 * Customer home after login: a snapshot of the account, what is on its way,
 * the cart, and recent activity — every number comes from the API.
 */
const CustomerDashboardPage = () => {
  const { user } = useAuth();
  const { items, summary, isEmpty: cartEmpty } = useCart();

  const profile = useApiResource(() => userApi.profile(), []);
  const recentOrders = useApiResource(() => orderApi.myOrders({ page: 1, limit: 5 }), []);
  const reviews = useApiResource(() => reviewApi.mine({ page: 1, limit: 3 }), []);

  const stats = profile.data?.stats;
  const orders = recentOrders.data?.orders ?? [];
  const activeOrders = orders.filter((order) => ACTIVE_STATUSES.includes(order.status));
  const nextDelivery = activeOrders[0];

  return (
    <div className="min-w-0">
      {/* Welcome */}
      <section className="relative overflow-hidden rounded-[2rem] bg-night-400 p-6 text-white noise sm:p-8 lg:p-10">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-600/50 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-xl font-bold shadow-glow ring-4 ring-white/10 sm:h-20 sm:w-20 sm:text-2xl">
              {user?.avatar?.url ? <img src={user.avatar.url} alt="" className="h-full w-full rounded-2xl object-cover" /> : initials(user?.name)}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">Customer dashboard</p>
              <h1 className="mt-1 text-white">Hi, {user?.name?.split(' ')[0]} 👋</h1>
              <p className="mt-1 text-white/60">
                {nextDelivery
                  ? `Order ${nextDelivery.orderNumber} is ${nextDelivery.status.toLowerCase()} — ${formatRelativeTime(nextDelivery.createdAt)}.`
                  : 'Nothing on its way right now. Ready for something new?'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button to="/products" variant="onBrand">Continue shopping</Button>
            <Button to="/orders" variant="onDark">Track orders</Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Orders placed" value={stats?.totalOrders ?? '—'} to="/orders" />
        <StatTile label="Total spent" value={stats ? formatCurrency(stats.totalSpent) : '—'} hint="Excludes cancelled" delay={60} />
        <StatTile label="In your cart" value={summary?.totalQuantity ?? 0} hint={cartEmpty ? 'Cart is empty' : formatCurrency(summary.total)} to="/cart" delay={120} />
        <StatTile label="Reviews written" value={stats?.totalReviews ?? '—'} delay={180} />
      </div>

      {/* Quick links */}
      <Reveal className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUICK_LINKS.map((link) => (
          <Link key={link.to} to={link.to} className="group flex items-center gap-3 rounded-2xl border border-ink-200/80 bg-surface p-4 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card">
            <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition group-hover:scale-105', link.tone)}>{link.icon}</span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-ink-900">{link.label}</span>
              <span className="block truncate text-xs text-ink-500">{link.text}</span>
            </span>
          </Link>
        ))}
      </Reveal>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Recent orders */}
        <Reveal as="section" className="card min-w-0 p-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold">Recent orders</h2>
              <p className="mt-0.5 text-sm text-ink-500">Your latest five, newest first.</p>
            </div>
            <Button to="/orders" variant="ghost" size="sm">View all</Button>
          </div>

          <div className="mt-4">
            {recentOrders.loading ? (
              <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
            ) : recentOrders.error ? (
              <ErrorState error={recentOrders.error} onRetry={recentOrders.reload} className="py-8" />
            ) : orders.length === 0 ? (
              <EmptyState compact className="border-0 bg-transparent" title="No orders yet" description="Your first order will show up here with live tracking." action={<Button to="/products">Start shopping</Button>} />
            ) : (
              <ul className="divide-y divide-ink-100">
                {orders.map((order) => (
                  <li key={order._id}>
                    <Link to={`/orders/${order._id}`} className="group -mx-2 flex items-center gap-4 rounded-xl px-2 py-3 transition hover:bg-ink-50">
                      <div className="flex shrink-0 -space-x-2">
                        {order.items.slice(0, 3).map((item, i) => (
                          <span key={`${item.product}-${i}`} className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border-2 border-white bg-ink-100 shadow-soft">
                            <ProductImage src={item.image} alt="" compact />
                          </span>
                        ))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate whitespace-nowrap font-mono text-[13px] font-bold text-ink-900">{order.orderNumber}</p>
                        <p className="text-xs text-ink-500">{formatDate(order.createdAt)} · {order.totalQuantity} item{order.totalQuantity === 1 ? '' : 's'}</p>
                      </div>
                      <span className="shrink-0"><StatusBadge status={order.status} /></span>
                      <p className="hidden w-24 text-right font-semibold text-ink-900 sm:block">{formatCurrency(order.totalPrice)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Reveal>

        <div className="min-w-0 space-y-6">
          {/* Cart snapshot */}
          <Reveal as="section" className="card p-6" delay={80}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Your cart</h2>
              <Button to="/cart" variant="ghost" size="sm">Open</Button>
            </div>
            {cartEmpty ? (
              <p className="mt-3 text-sm text-ink-500">Your cart is empty. Anything you add is saved to your account.</p>
            ) : (
              <>
                <ul className="mt-3 space-y-2.5">
                  {items.slice(0, 3).map((item) => (
                    <li key={item.product._id} className="flex items-center gap-3">
                      <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-ink-100 bg-ink-100">
                        <ProductImage src={item.product.image} alt="" compact />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-800">{item.product.name}</span>
                      <span className="text-xs text-ink-500">×{item.quantity}</span>
                    </li>
                  ))}
                </ul>
                {items.length > 3 && <p className="mt-2 text-xs text-ink-400">+{items.length - 3} more</p>}
                <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3">
                  <span className="text-sm text-ink-500">Total</span>
                  <span className="font-display text-lg font-bold text-ink-900">{formatCurrency(summary.total)}</span>
                </div>
                <Button to="/checkout" fullWidth className="mt-3" size="sm">Checkout</Button>
              </>
            )}
          </Reveal>

          {/* Recent reviews */}
          <Reveal as="section" className="card p-6" delay={140}>
            <h2 className="text-base font-bold">Your reviews</h2>
            {reviews.loading ? (
              <div className="mt-3 space-y-2">{[0, 1].map((i) => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
            ) : (reviews.data?.reviews ?? []).length === 0 ? (
              <p className="mt-3 text-sm text-ink-500">You have not reviewed anything yet. Reviews from verified purchases get a badge.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {reviews.data.reviews.map((review) => (
                  <li key={review._id}>
                    <Link to={`/products/${review.product?.slug ?? review.product?._id}`} className="block rounded-xl border border-ink-100 p-3 transition hover:border-brand-200 hover:bg-brand-50/40">
                      <p className="truncate text-sm font-semibold text-ink-900">{review.product?.name ?? 'Product'}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Rating value={review.rating} size="xs" />
                        <span className="text-xs text-ink-400">{formatRelativeTime(review.createdAt)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Reveal>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboardPage;
