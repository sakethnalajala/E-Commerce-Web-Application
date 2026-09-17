import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { productApi } from '@/api';
import { formatCurrency, discountPercent, truncate } from '@/utils/format';
import useApiResource from '@/hooks/useApiResource';
import useToast from '@/hooks/useToast';
import PageHeader from '@/components/common/PageHeader';
import StatCard, { statIcon } from '@/components/admin/StatCard';
import ComingSoon from '@/components/admin/ComingSoon';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { Alert } from '@/components/ui/States';
import cn from '@/utils/cn';
import ProductImage from '@/components/product/ProductImage';

/**
 * Discounts & offers. Per-product discount pricing is a real backend feature
 * (Product.discountPrice, enforced < price); this page manages it through the
 * existing PUT /products/:id. Coupon codes are not supported yet and say so.
 */
const DiscountsPage = () => {
  const toast = useToast();
  const [tab, setTab] = useState('active');
  const [target, setTarget] = useState(null);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  const products = useApiResource(() => productApi.adminList({ limit: 100, sort: 'newest' }), []);
  const all = products.data?.products ?? [];

  const discounted = useMemo(() => all.filter((p) => p.discountPrice && p.discountPrice < p.price).sort((a, b) => discountPercent(b.price, b.discountPrice) - discountPercent(a.price, a.discountPrice)), [all]);
  const fullPrice = useMemo(() => all.filter((p) => !p.discountPrice || p.discountPrice >= p.price), [all]);

  const totalSavings = discounted.reduce((sum, p) => sum + (p.price - p.discountPrice), 0);
  const avgDiscount = discounted.length ? Math.round(discounted.reduce((sum, p) => sum + discountPercent(p.price, p.discountPrice), 0) / discounted.length) : 0;

  const openEditor = (product) => {
    setTarget(product);
    setValue(product.discountPrice ? String(product.discountPrice) : '');
  };

  const save = async ({ clear = false } = {}) => {
    const next = clear ? '' : Number(value);
    if (!clear && (!Number.isFinite(next) || next <= 0 || next >= target.price)) {
      toast.error('The offer price must be greater than 0 and lower than the original price.');
      return;
    }
    setSaving(true);
    try {
      // The product endpoint is multipart (it also carries images); a FormData
      // with only discountPrice is the documented way to change one field.
      const form = new FormData();
      form.append('discountPrice', clear ? '' : String(next));
      await productApi.update(target._id, form);
      toast.success(clear ? `Offer removed from "${truncate(target.name, 30)}".` : `Offer price set on "${truncate(target.name, 30)}".`);
      setTarget(null);
      await products.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const preview = target && Number(value) > 0 && Number(value) < target.price ? discountPercent(target.price, Number(value)) : 0;

  const productCell = (product) => (
    <div className="flex items-center gap-3">
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-ink-200 bg-ink-100">
        <ProductImage src={product.images?.[0]} alt="" compact />
      </div>
      <div className="min-w-0">
        <Link to={`/admin/products/${product._id}/edit`} className="block truncate font-medium text-ink-900 hover:text-brand-700">{truncate(product.name, 44)}</Link>
        <p className="text-xs text-ink-500">{product.brand} · {product.category?.name ?? '—'}</p>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader title="Discounts & offers" description="Offer prices are enforced server-side and shown as strike-through pricing across the store." />

      <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Products on offer" value={discounted.length} hint={`of ${all.length} products`} loading={products.loading} tone="success" icon={statIcon(<><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></>)} />
        <StatCard label="Average discount" value={`${avgDiscount}%`} hint="Across active offers" loading={products.loading} tone="warning" icon={statIcon(<><path d="M19 5 5 19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></>)} />
        <StatCard label="Per-unit savings" value={formatCurrency(totalSavings)} hint="Sum of all offer reductions" loading={products.loading} tone="info" icon={statIcon(<><path d="M12 2v20" /><path d="M17 6.5A4 4 0 0 0 13 4h-2a3.5 3.5 0 0 0 0 7h2a3.5 3.5 0 0 1 0 7h-2a4 4 0 0 1-4-2.5" /></>)} />
        <StatCard label="At full price" value={fullPrice.length} hint="Candidates for a new offer" loading={products.loading} tone="neutral" icon={statIcon(<><path d="M20 7.5 12 3 4 7.5v9L12 21l8-4.5v-9Z" /></>)} />
      </div>

      <div className="mt-6 flex gap-2">
        {[{ id: 'active', label: `Active offers (${discounted.length})` }, { id: 'candidates', label: `Full price (${fullPrice.length})` }, { id: 'coupons', label: 'Coupon codes' }].map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setTab(option.id)}
            className={cn('rounded-full px-4 py-2 text-sm font-semibold transition-all active:scale-95', tab === option.id ? 'bg-ink-900 text-surface shadow-soft' : 'border border-ink-200 bg-surface text-ink-600 hover:bg-ink-50')}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'coupons' ? (
          <ComingSoon
            title="Coupon codes"
            description="Promo codes applied at checkout (percentage or fixed amount, usage limits, expiry) are not part of the backend yet. Nothing here is simulated — when the Coupon model and validation land on the server, this page will manage them."
            requires="A Coupon collection, a validation step in the checkout service, and an admin CRUD surface."
            alternatives={[{ to: '/admin/discounts', label: 'Per-product offers' }, { to: '/admin/products', label: 'Products' }]}
          />
        ) : (
          <DataTable
            loading={products.loading}
            error={products.error}
            onRetry={products.reload}
            rows={tab === 'active' ? discounted : fullPrice}
            emptyTitle={tab === 'active' ? 'No active offers' : 'Every product already has an offer'}
            emptyDescription={tab === 'active' ? 'Pick a product from the "Full price" tab to create one.' : ''}
            columns={[
              { key: 'name', header: 'Product', render: productCell },
              { key: 'price', header: 'Original', render: (p) => <span className={cn('text-ink-700', p.discountPrice && 'line-through text-ink-400')}>{formatCurrency(p.price)}</span> },
              { key: 'discountPrice', header: 'Offer price', render: (p) => p.discountPrice ? <span className="font-semibold text-ink-900">{formatCurrency(p.discountPrice)}</span> : <span className="text-ink-400">—</span> },
              { key: 'pct', header: 'Discount', render: (p) => p.discountPrice ? <Badge tone="gold">−{discountPercent(p.price, p.discountPrice)}%</Badge> : <Badge>None</Badge> },
              { key: 'stock', header: 'Stock', render: (p) => <span className={cn(p.stock <= 0 ? 'text-danger-600' : 'text-ink-600')}>{p.stock}</span> },
              {
                key: 'actions', header: '', className: 'text-right',
                render: (p) => (
                  <div className="flex justify-end gap-2">
                    <Button variant={p.discountPrice ? 'outline' : 'primary'} size="xs" onClick={() => openEditor(p)}>{p.discountPrice ? 'Edit offer' : 'Create offer'}</Button>
                  </div>
                ),
              },
            ]}
            renderMobileCard={(p) => (
              <div className="card p-4">
                {productCell(p)}
                <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3">
                  <span className="text-sm">
                    <span className="font-semibold text-ink-900">{formatCurrency(p.discountPrice ?? p.price)}</span>
                    {p.discountPrice && <span className="ml-2 text-xs text-ink-400 line-through">{formatCurrency(p.price)}</span>}
                  </span>
                  <Button variant={p.discountPrice ? 'outline' : 'primary'} size="xs" onClick={() => openEditor(p)}>{p.discountPrice ? 'Edit' : 'Create offer'}</Button>
                </div>
              </div>
            )}
          />
        )}
      </div>

      <Modal
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        title={target?.discountPrice ? 'Edit offer' : 'Create offer'}
        description={target?.name}
        size="sm"
        footer={
          <>
            {target?.discountPrice && <Button variant="ghost" className="text-danger-600 sm:mr-auto" onClick={() => save({ clear: true })} disabled={saving}>Remove offer</Button>}
            <Button variant="outline" onClick={() => setTarget(null)} disabled={saving}>Cancel</Button>
            <Button onClick={() => save()} loading={saving}>Save offer</Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">Original price <span className="font-semibold text-ink-900">{target && formatCurrency(target.price)}</span></p>
        <Input label="Offer price" type="number" min={0} step="0.01" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Lower than the original price" containerClassName="mt-4" />
        {preview > 0 ? (
          <Alert tone="success" className="mt-4">Customers will see <strong>−{preview}%</strong> and pay {formatCurrency(Number(value))}.</Alert>
        ) : (
          <p className="mt-3 text-xs text-ink-400">The server rejects any offer price that is not below the original price.</p>
        )}
      </Modal>
    </div>
  );
};

export default DiscountsPage;
