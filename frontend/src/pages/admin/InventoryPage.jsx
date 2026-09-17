import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productApi, analyticsApi } from '@/api';
import { formatCurrency, formatCurrencyCompact, formatNumber, truncate } from '@/utils/format';
import useApiResource from '@/hooks/useApiResource';
import useDebounce from '@/hooks/useDebounce';
import useToast from '@/hooks/useToast';
import PageHeader from '@/components/common/PageHeader';
import StatCard, { statIcon } from '@/components/admin/StatCard';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import cn from '@/utils/cn';
import ProductImage from '@/components/product/ProductImage';

const FILTERS = [
  { id: 'all', label: 'All products' },
  { id: 'low', label: 'Low stock' },
  { id: 'out', label: 'Out of stock' },
  { id: 'healthy', label: 'Healthy' },
];

/**
 * Stock management. Uses the inventory analytics for the summary and the admin
 * product list + PATCH /products/:id/stock for adjustments — no new backend.
 */
const InventoryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const filter = searchParams.get('filter') ?? 'all';
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);

  const [target, setTarget] = useState(null);
  const [value, setValue] = useState(0);
  const [saving, setSaving] = useState(false);

  const inventory = useApiResource(() => analyticsApi.inventory(), []);
  const threshold = inventory.data?.lowStockThreshold ?? 10;

  // One wide fetch, filtered client-side: the catalogue is small and the low
  // stock band is not a server-side filter.
  const products = useApiResource(
    () => productApi.adminList({ limit: 100, sort: 'newest', ...(debouncedSearch && { search: debouncedSearch }) }),
    [debouncedSearch]
  );

  const rows = useMemo(() => {
    const all = products.data?.products ?? [];
    const filtered = all.filter((product) => {
      if (filter === 'low') return product.stock > 0 && product.stock <= threshold;
      if (filter === 'out') return product.stock <= 0;
      if (filter === 'healthy') return product.stock > threshold;
      return true;
    });
    // Most urgent first.
    return filtered.sort((a, b) => a.stock - b.stock);
  }, [products.data, filter, threshold]);

  const totals = inventory.data?.totals;

  const setFilter = (next) => setSearchParams(next === 'all' ? {} : { filter: next }, { replace: true });

  const openAdjust = (product) => {
    setTarget(product);
    setValue(product.stock);
  };

  const saveStock = async () => {
    setSaving(true);
    try {
      await productApi.updateStock(target._id, Number(value));
      toast.success(`Stock for "${truncate(target.name, 30)}" set to ${value}.`);
      setTarget(null);
      await Promise.all([products.reload(), inventory.reload()]);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const stockBadge = (stock) => {
    if (stock <= 0) return <Badge tone="danger" dot>Out of stock</Badge>;
    if (stock <= threshold) return <Badge tone="warning" dot>Low · {stock} left</Badge>;
    return <Badge tone="success" dot>{stock} in stock</Badge>;
  };

  return (
    <div>
      <PageHeader
        title="Inventory"
        description={`Stock levels across the catalogue. Products at or below ${threshold} units are flagged as low.`}
        actions={<Button to="/admin/products/new">Add product</Button>}
      />

      <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Units in stock" value={formatNumber(totals?.availableInventory ?? 0)} hint={`${formatCurrencyCompact(totals?.inventoryValue ?? 0)} at retail`} loading={inventory.loading} tone="success" icon={statIcon(<><path d="M20 7.5 12 3 4 7.5v9L12 21l8-4.5v-9Z" /><path d="M4 7.5 12 12l8-4.5M12 12v9" /></>)} />
        <StatCard label="Low stock" value={formatNumber(totals?.lowStockProducts ?? 0)} hint="Needs a restock soon" loading={inventory.loading} tone="warning" icon={statIcon(<><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.8 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.8a2 2 0 0 0-3.4 0Z" /></>)} />
        <StatCard label="Out of stock" value={formatNumber(totals?.outOfStockProducts ?? 0)} hint="Hidden from add-to-cart" loading={inventory.loading} tone="danger" icon={statIcon(<><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" /></>)} />
        <StatCard label="Units sold" value={formatNumber(totals?.unitsSold ?? 0)} hint="All time" loading={inventory.loading} tone="info" icon={statIcon(<><path d="M4 19V5" /><path d="M20 19H4" /><path d="M8 16v-5M12 16V8M16 16v-3" /></>)} />
      </div>

      <div className="card mt-6 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="scrollbar-none flex gap-2 overflow-x-auto">
            {FILTERS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setFilter(option.id)}
                className={cn(
                  'shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all active:scale-95',
                  filter === option.id ? 'bg-ink-900 text-surface shadow-soft' : 'border border-ink-200 bg-surface text-ink-600 hover:bg-ink-50'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Input
            placeholder="Search by name or brand…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search inventory"
            containerClassName="lg:w-80"
            leadingIcon={<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.2-3.2" strokeLinecap="round" /></svg>}
          />
        </div>
      </div>

      <DataTable
        className="mt-5"
        loading={products.loading}
        error={products.error}
        onRetry={products.reload}
        rows={rows}
        emptyTitle={filter === 'all' ? 'No products found' : `Nothing is ${filter === 'out' ? 'out of stock' : filter === 'low' ? 'running low' : 'in this band'}`}
        emptyDescription={filter === 'all' ? 'Try another search.' : 'Good news — nothing needs attention here.'}
        columns={[
          {
            key: 'name',
            header: 'Product',
            render: (product) => (
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-ink-200 bg-ink-100">
                  <ProductImage src={product.images?.[0]} alt="" compact />
                </div>
                <div className="min-w-0">
                  <Link to={`/admin/products/${product._id}/edit`} className="block truncate font-medium text-ink-900 hover:text-brand-700">{truncate(product.name, 44)}</Link>
                  <p className="text-xs text-ink-500">{product.brand} · {product.category?.name ?? '—'}</p>
                </div>
              </div>
            ),
          },
          { key: 'stock', header: 'Stock', render: (product) => stockBadge(product.stock) },
          { key: 'sold', header: 'Sold', render: (product) => <span className="text-ink-600">{formatNumber(product.sold ?? 0)}</span> },
          { key: 'price', header: 'Price', render: (product) => <span className="font-semibold text-ink-900">{formatCurrency(product.effectivePrice ?? product.price)}</span> },
          {
            key: 'value',
            header: 'Stock value',
            className: 'text-right',
            headerClassName: 'text-right',
            render: (product) => <span className="text-ink-700">{formatCurrency(product.stock * (product.effectivePrice ?? product.price))}</span>,
          },
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (product) => (
              <Button variant={product.stock <= threshold ? 'primary' : 'outline'} size="xs" onClick={() => openAdjust(product)}>
                {product.stock <= 0 ? 'Restock' : 'Adjust'}
              </Button>
            ),
          },
        ]}
        renderMobileCard={(product) => (
          <div className="card p-4">
            <div className="flex gap-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-ink-200 bg-ink-100">
                <ProductImage src={product.images?.[0]} alt="" compact />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink-900">{product.name}</p>
                <p className="text-xs text-ink-500">{product.brand}</p>
                <div className="mt-1.5">{stockBadge(product.stock)}</div>
              </div>
            </div>
            <Button fullWidth size="sm" variant={product.stock <= threshold ? 'primary' : 'outline'} className="mt-3" onClick={() => openAdjust(product)}>
              {product.stock <= 0 ? 'Restock' : 'Adjust stock'}
            </Button>
          </div>
        )}
      />

      <Modal
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        title="Adjust stock"
        description={target?.name}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setTarget(null)} disabled={saving}>Cancel</Button>
            <Button onClick={saveStock} loading={saving}>Save stock</Button>
          </>
        }
      >
        <Input label="Units in stock" type="number" min={0} value={value} onChange={(event) => setValue(event.target.value)} hint="Customers can never order more than this." />
        <div className="mt-3 flex flex-wrap gap-2">
          {[10, 25, 50, 100].map((preset) => (
            <button key={preset} type="button" onClick={() => setValue(preset)} className="rounded-full border border-ink-200 px-3 py-1 text-xs font-semibold text-ink-600 transition hover:border-brand-300 hover:text-brand-700">
              Set {preset}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default InventoryPage;
