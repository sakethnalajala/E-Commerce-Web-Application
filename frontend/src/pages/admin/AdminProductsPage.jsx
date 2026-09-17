import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productApi, categoryApi } from '@/api';
import { ADMIN_PAGE_SIZE, SORT_OPTIONS } from '@/constants';
import { formatCurrency, formatDate, truncate } from '@/utils/format';
import useApiResource from '@/hooks/useApiResource';
import useDebounce from '@/hooks/useDebounce';
import useToast from '@/hooks/useToast';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Pagination from '@/components/ui/Pagination';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input, { Select } from '@/components/ui/Input';
import Modal, { ConfirmDialog } from '@/components/ui/Modal';
import cn from '@/utils/cn';
import ProductImage from '@/components/product/ProductImage';

const AdminProductsPage = () => {
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [stockFilter, setStockFilter] = useState(searchParams.get('inStock') ?? '');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [stockTarget, setStockTarget] = useState(null);
  const [stockValue, setStockValue] = useState(0);
  const [savingStock, setSavingStock] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const params = useMemo(
    () => ({
      page,
      limit: ADMIN_PAGE_SIZE,
      sort,
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(category && { category }),
      ...(stockFilter !== '' && { inStock: stockFilter }),
      ...(status !== '' && { isActive: status }),
    }),
    [page, sort, debouncedSearch, category, stockFilter, status]
  );

  const resource = useApiResource(() => productApi.adminList(params), [params]);
  const categories = useApiResource(() => categoryApi.list(), []);

  const products = resource.data?.products ?? [];

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await productApi.remove(deleteTarget._id);
      toast.success(response.message);
      setDeleteTarget(null);
      await resource.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleStockSave = async () => {
    setSavingStock(true);
    try {
      await productApi.updateStock(stockTarget._id, Number(stockValue));
      toast.success(`Stock for "${truncate(stockTarget.name, 30)}" updated.`);
      setStockTarget(null);
      await resource.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingStock(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setCategory('');
    setStockFilter('');
    setStatus('');
    setSort('newest');
    setPage(1);
  };

  const stockCell = (product) => (
    <button
      type="button"
      onClick={() => {
        setStockTarget(product);
        setStockValue(product.stock);
      }}
      className={cn(
        'rounded-lg px-2 py-1 text-sm font-semibold transition hover:bg-ink-100',
        product.stock <= 0
          ? 'text-danger-600'
          : product.stock <= 10
            ? 'text-warning-600'
            : 'text-ink-700'
      )}
      title="Click to adjust stock"
    >
      {product.stock}
    </button>
  );

  return (
    <div>
      <PageHeader
        title="Products"
        description="Create, update and archive everything in the catalogue."
        actions={<Button to="/admin/products/new">Add product</Button>}
      />

      {/* Filters */}
      <div className="card mt-6 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            placeholder="Search by name or brand…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            aria-label="Search products"
            containerClassName="lg:col-span-2"
            leadingIcon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.2-3.2" strokeLinecap="round" />
              </svg>
            }
          />

          <Select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {(categories.data?.categories ?? []).map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </Select>

          <Select
            value={stockFilter}
            onChange={(event) => {
              setStockFilter(event.target.value);
              setPage(1);
            }}
            aria-label="Filter by stock"
          >
            <option value="">Any stock level</option>
            <option value="true">In stock</option>
            <option value="false">Out of stock</option>
          </Select>

          <Select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products">
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            aria-label="Filter by visibility"
            containerClassName="w-48"
          >
            <option value="">Active and archived</option>
            <option value="true">Active only</option>
            <option value="false">Archived only</option>
          </Select>

          <button type="button" onClick={resetFilters} className="text-sm font-medium text-ink-500 hover:text-ink-800">
            Reset filters
          </button>

          <span className="ml-auto text-sm text-ink-500">
            {resource.meta ? `${resource.meta.total} products` : ''}
          </span>
        </div>
      </div>

      <DataTable
        className="mt-5"
        loading={resource.loading}
        error={resource.error}
        onRetry={resource.reload}
        rows={products}
        emptyTitle="No products found"
        emptyDescription="Adjust the filters, or add your first product."
        emptyAction={<Button to="/admin/products/new">Add product</Button>}
        columns={[
          {
            key: 'name',
            header: 'Product',
            render: (product) => (
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-ink-200 bg-ink-100">
                  {product.images?.[0]?.url && (
                    <ProductImage src={product.images?.[0]} alt="" category={product.category} compact />
                  )}
                </div>
                <div className="min-w-0">
                  <Link
                    to={`/admin/products/${product._id}/edit`}
                    className="block truncate font-medium text-ink-900 hover:text-brand-700"
                  >
                    {truncate(product.name, 44)}
                  </Link>
                  <p className="text-xs text-ink-500">{product.brand}</p>
                </div>
              </div>
            ),
          },
          {
            key: 'category',
            header: 'Category',
            render: (product) => <span className="text-ink-600">{product.category?.name ?? '—'}</span>,
          },
          {
            key: 'price',
            header: 'Price',
            render: (product) => (
              <div>
                <p className="font-semibold text-ink-900">
                  {formatCurrency(product.effectivePrice ?? product.price)}
                </p>
                {product.discountPrice && (
                  <p className="text-xs text-ink-400 line-through">{formatCurrency(product.price)}</p>
                )}
              </div>
            ),
          },
          { key: 'stock', header: 'Stock', render: stockCell },
          {
            key: 'isActive',
            header: 'Status',
            render: (product) =>
              product.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="neutral">Archived</Badge>,
          },
          {
            key: 'createdAt',
            header: 'Added',
            render: (product) => <span className="text-ink-500">{formatDate(product.createdAt)}</span>,
          },
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (product) => (
              <div className="flex justify-end gap-2">
                <Button to={`/admin/products/${product._id}/edit`} variant="outline" size="xs">
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  className="text-danger-600"
                  onClick={() => setDeleteTarget(product)}
                >
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
        renderMobileCard={(product) => (
          <div className="card p-4">
            <div className="flex gap-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-ink-200 bg-ink-100">
                {product.images?.[0]?.url && (
                  <ProductImage src={product.images?.[0]} alt="" category={product.category} compact />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink-900">{product.name}</p>
                <p className="text-xs text-ink-500">
                  {product.brand} · {product.category?.name}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink-900">
                    {formatCurrency(product.effectivePrice ?? product.price)}
                  </span>
                  <Badge tone={product.stock <= 0 ? 'danger' : product.stock <= 10 ? 'warning' : 'success'}>
                    {product.stock} in stock
                  </Badge>
                  {!product.isActive && <Badge tone="neutral">Archived</Badge>}
                </div>
              </div>
            </div>

            <div className="mt-3 flex gap-2 border-t border-ink-100 pt-3">
              <Button to={`/admin/products/${product._id}/edit`} variant="outline" size="xs" className="flex-1">
                Edit
              </Button>
              <Button
                variant="outline"
                size="xs"
                className="flex-1"
                onClick={() => {
                  setStockTarget(product);
                  setStockValue(product.stock);
                }}
              >
                Stock
              </Button>
              <Button
                variant="ghost"
                size="xs"
                className="flex-1 text-danger-600"
                onClick={() => setDeleteTarget(product)}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      />

      {resource.meta && <Pagination meta={resource.meta} onPageChange={setPage} className="mt-6" />}

      {/* Quick stock editor */}
      <Modal
        open={Boolean(stockTarget)}
        onClose={() => setStockTarget(null)}
        title="Adjust stock"
        description={stockTarget?.name}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setStockTarget(null)} disabled={savingStock}>
              Cancel
            </Button>
            <Button onClick={handleStockSave} loading={savingStock}>
              Save stock
            </Button>
          </>
        }
      >
        <Input
          label="Units in stock"
          type="number"
          min={0}
          value={stockValue}
          onChange={(event) => setStockValue(event.target.value)}
          hint="Customers cannot order more than this."
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={`Delete "${truncate(deleteTarget?.name ?? '', 40)}"?`}
        description="Products that appear in existing orders are archived instead of deleted, so order history stays intact."
        confirmLabel="Delete product"
      />
    </div>
  );
};

export default AdminProductsPage;
