import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderApi, userApi } from '@/api';
import { checkoutValidators } from '@/utils/validators';
import { formatCurrency } from '@/utils/format';
import useForm from '@/hooks/useForm';
import useCart from '@/hooks/useCart';
import useAuth from '@/hooks/useAuth';
import useToast from '@/hooks/useToast';
import OrderSummary from '@/components/cart/OrderSummary';
import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/ui/Button';
import Input, { Textarea } from '@/components/ui/Input';
import { Alert, EmptyState } from '@/components/ui/States';
import cn from '@/utils/cn';
import ProductImage from '@/components/product/ProductImage';

const Step = ({ number, title, done }) => (
  <div className="flex items-center gap-3">
    <span
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition',
        done ? 'bg-success-600 text-white' : 'bg-brand-600 text-white shadow-glow-sm'
      )}
    >
      {done ? (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      ) : (
        number
      )}
    </span>
    <span className="text-sm font-bold text-ink-900">{title}</span>
  </div>
);

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, summary, isEmpty, resetAfterCheckout } = useCart();
  const toast = useToast();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const form = useForm({
    initialValues: {
      fullName: user?.name ?? '',
      phone: user?.phone ?? '',
      addressLine: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
    },
    validators: checkoutValidators,
    onSubmit: async (values) => {
      const response = await orderApi.create(values);
      const order = response.data.order;
      resetAfterCheckout();
      toast.success(`Order ${order.orderNumber} placed successfully!`);
      navigate(`/orders/${order._id}`, { replace: true, state: { justPlaced: true } });
    },
  });

  useEffect(() => {
    let cancelled = false;
    userApi
      .addresses()
      .then((response) => {
        if (cancelled) return;
        const saved = response.data.addresses ?? [];
        setAddresses(saved);
        const preferred = saved.find((address) => address.isDefault) ?? saved[0];
        if (preferred) {
          setSelectedAddressId(preferred._id);
          form.setValues((current) => ({
            ...current,
            fullName: preferred.fullName,
            phone: preferred.phone,
            addressLine: preferred.addressLine,
            city: preferred.city,
            state: preferred.state,
            postalCode: preferred.postalCode,
            country: preferred.country ?? 'India',
          }));
        }
      })
      .catch(() => {
        // Saved addresses are a convenience; the form still works without them.
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyAddress = (address) => {
    setSelectedAddressId(address._id);
    form.setValues((current) => ({
      ...current,
      fullName: address.fullName,
      phone: address.phone,
      addressLine: address.addressLine,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country ?? 'India',
    }));
  };

  if (isEmpty) {
    return (
      <div className="container-page py-10">
        <EmptyState
          title="There is nothing to check out"
          description="Your cart is empty. Add a few products and come back."
          action={<Button to="/products" size="lg">Browse products</Button>}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8 sm:py-10">
      <PageHeader
        back="/cart"
        backLabel="Back to cart"
        eyebrow="Secure checkout"
        title="Almost done"
        description="Confirm where we should deliver and place your order — payment happens at your door."
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Cart', to: '/cart' }, { label: 'Checkout' }]}
      />

      {/* Progress */}
      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-ink-200/80 bg-surface px-5 py-3.5 shadow-soft sm:gap-8">
        <Step number={1} title="Cart" done />
        <span className="hidden h-px w-10 bg-ink-200 sm:block" />
        <Step number={2} title="Shipping" />
        <span className="hidden h-px w-10 bg-ink-200 sm:block" />
        <div className="flex items-center gap-3 opacity-50">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-100 text-sm font-bold text-ink-500">3</span>
          <span className="text-sm font-bold text-ink-700">Confirmation</span>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr,400px]">
        <div className="space-y-6">
          {addresses.length > 0 && (
            <section className="card p-6">
              <h2 className="text-base font-bold">Saved addresses</h2>
              <p className="mt-1 text-sm text-ink-500">Pick one to fill the form instantly.</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {addresses.map((address) => {
                  const selected = selectedAddressId === address._id;
                  return (
                    <button
                      key={address._id}
                      type="button"
                      onClick={() => applyAddress(address)}
                      className={cn(
                        'relative rounded-2xl border p-4 text-left transition-all duration-200',
                        selected
                          ? 'border-brand-500 bg-brand-50/60 shadow-glow-sm ring-1 ring-brand-500'
                          : 'border-ink-200 hover:border-ink-300 hover:bg-ink-50'
                      )}
                      aria-pressed={selected}
                    >
                      {selected && (
                        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white">
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                        </span>
                      )}
                      <div className="flex items-center gap-2 pr-8">
                        <span className="text-sm font-bold text-ink-900">{address.label}</span>
                        {address.isDefault && <span className="rounded-full bg-ink-900 px-2 py-0.5 text-[10px] font-bold uppercase text-surface">Default</span>}
                      </div>
                      <p className="mt-1.5 text-sm text-ink-700">{address.fullName}</p>
                      <p className="text-sm text-ink-500">{address.addressLine}, {address.city}, {address.state} {address.postalCode}</p>
                      <p className="mt-1 text-sm text-ink-500">{address.phone}</p>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <form onSubmit={form.handleSubmit} className="card p-6" noValidate>
            <h2 className="text-base font-bold">Shipping details</h2>
            <p className="mt-1 text-sm text-ink-500">We will call this number if the courier needs directions.</p>

            {form.submitError && (
              <Alert tone="error" className="mt-4" title="Could not place your order">
                {form.submitError}
                <Link to="/cart" className="mt-1 block font-semibold underline">Review your cart</Link>
              </Alert>
            )}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Input label="Full name" required autoComplete="name" {...form.fieldProps('fullName')} />
              <Input label="Phone number" type="tel" required autoComplete="tel" placeholder="9876543210" {...form.fieldProps('phone')} />
            </div>

            <div className="mt-4">
              <Textarea label="Address" required rows={3} autoComplete="street-address" placeholder="House / flat number, street, landmark" {...form.fieldProps('addressLine')} />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input label="City" required autoComplete="address-level2" {...form.fieldProps('city')} />
              <Input label="State" required autoComplete="address-level1" {...form.fieldProps('state')} />
              <Input label="Postal code" required autoComplete="postal-code" placeholder="560001" {...form.fieldProps('postalCode')} />
              <Input label="Country" autoComplete="country-name" {...form.fieldProps('country')} />
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-brand-600 shadow-soft">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></svg>
              </span>
              <div>
                <p className="text-sm font-bold text-ink-900">Cash on delivery</p>
                <p className="mt-0.5 text-sm text-ink-600">Pay the courier when your order arrives. No online payment needed.</p>
              </div>
            </div>

            <Button type="submit" size="xl" fullWidth className="mt-6" loading={form.submitting}>
              Place order · {formatCurrency(summary.total)}
            </Button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-ink-400">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></svg>
              Prices, stock and the total are verified on the server before the order is created.
            </p>
          </form>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <OrderSummary summary={summary} title="Order total" />

          <div className="card p-5">
            <h3 className="text-sm font-bold text-ink-900">In this order · {summary.totalQuantity} items</h3>
            <ul className="mt-3 divide-y divide-ink-100">
              {items.map((item) => (
                <li key={item.product._id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-ink-100 bg-ink-100">
                    <ProductImage src={item.product.image} alt="" compact />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">{item.product.name}</p>
                    <p className="text-xs text-ink-500">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
                  </div>
                  <p className="shrink-0 text-sm font-bold">{formatCurrency(item.subtotal)}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
