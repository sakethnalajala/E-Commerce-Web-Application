import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useCart from '@/hooks/useCart';
import useAuth from '@/hooks/useAuth';
import CartItemRow from '@/components/cart/CartItemRow';
import OrderSummary from '@/components/cart/OrderSummary';
import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState, Alert } from '@/components/ui/States';
import { LoadingBlock } from '@/components/ui/Spinner';

const CartPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { items, summary, notices, loading, mutating, updateItem, removeItem, clear, isEmpty } = useCart();
  const [confirmClear, setConfirmClear] = useState(false);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }
    navigate('/checkout');
  };

  if (loading && isEmpty) return <LoadingBlock label="Loading your cart…" className="min-h-[50vh]" />;

  return (
    <div className="container-page py-8 sm:py-10">
      <PageHeader
        back="/products"
        backLabel="Continue shopping"
        eyebrow="Your bag"
        title="Shopping cart"
        description={isEmpty ? undefined : `${summary.totalQuantity} item${summary.totalQuantity === 1 ? '' : 's'} ready for checkout`}
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Cart' }]}
        actions={
          !isEmpty && (
            <Button variant="ghost" className="text-danger-600 hover:bg-danger-50" onClick={() => setConfirmClear(true)}>
              Clear cart
            </Button>
          )
        }
      />

      {notices?.length > 0 && (
        <div className="mt-6 space-y-2">
          {notices.map((notice, index) => (
            <Alert key={index} tone="warning">{notice.message}</Alert>
          ))}
        </div>
      )}

      {isEmpty ? (
        <EmptyState
          className="mt-8"
          title="Your cart is empty"
          description="Browse the catalogue and add a few things you like — they will show up here, even after you log in."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button to="/products" size="lg">Start shopping</Button>
              <Button to="/products?sort=popular" variant="outline" size="lg">See best sellers</Button>
            </div>
          }
        />
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr,400px]">
          <section>
            <ul className="space-y-3">
              {items.map((item, index) => (
                <div key={item.product._id} className="animate-fade-up" style={{ animationDelay: `${index * 50}ms` }}>
                  <CartItemRow item={item} disabled={mutating} onQuantityChange={updateItem} onRemove={removeItem} />
                </div>
              ))}
            </ul>

            <div className="mt-6 flex items-center justify-between">
              <Link to="/products" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition hover:text-brand-700">
                <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
                Continue shopping
              </Link>
              <p className="text-sm text-ink-500">Prices verified on the server at checkout</p>
            </div>
          </section>

          <div className="lg:sticky lg:top-24 lg:h-fit">
            <OrderSummary
              summary={summary}
              footer={
                <div className="space-y-3">
                  <Button size="lg" fullWidth onClick={handleCheckout} disabled={mutating}>
                    {isAuthenticated ? 'Proceed to checkout' : 'Log in to check out'}
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </Button>
                  {!isAuthenticated && (
                    <p className="text-center text-xs text-ink-500">Your cart is saved and will be waiting after you log in.</p>
                  )}
                  <div className="flex items-center justify-center gap-4 pt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                    <span>Cash on delivery</span>
                    <span className="h-1 w-1 rounded-full bg-ink-300" />
                    <span>Cancel before dispatch</span>
                  </div>
                </div>
              }
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={async () => {
          await clear();
          setConfirmClear(false);
        }}
        title="Clear your cart?"
        description="Every item will be removed. This cannot be undone."
        confirmLabel="Clear cart"
      />
    </div>
  );
};

export default CartPage;
