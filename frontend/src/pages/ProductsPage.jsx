import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productApi } from '@/api';
import { PAGE_SIZE, SORT_OPTIONS } from '@/constants';
import useApiResource from '@/hooks/useApiResource';
import useDebounce from '@/hooks/useDebounce';
import ProductGrid from '@/components/product/ProductGrid';
import FilterSidebar from '@/components/product/FilterSidebar';
import Pagination from '@/components/ui/Pagination';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Select } from '@/components/ui/Input';
import cn from '@/utils/cn';

/** Reads the current filter set out of the URL, so every view is shareable. */
const readFilters = (params) => ({
  search: params.get('search') ?? '',
  category: params.get('category') ?? '',
  brand: params.get('brand') ?? '',
  minPrice: params.get('minPrice') ?? '',
  maxPrice: params.get('maxPrice') ?? '',
  rating: params.get('rating') ?? '',
  inStock: params.get('inStock') === 'true',
  sort: params.get('sort') ?? 'newest',
  page: Number(params.get('page')) || 1,
});

const SORT_TITLES = {
  popular: 'Best sellers',
  newest: 'New arrivals',
  rating: 'Top rated',
  'price-asc': 'Best value',
};

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);

  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 450);
  const [filtersOpen, setFiltersOpen] = useState(false);

  /** Writes a partial patch back into the URL, resetting page unless told otherwise. */
  const applyFilters = useCallback(
    (patch, { resetPage = true } = {}) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          Object.entries(patch).forEach(([key, value]) => {
            if (value === undefined || value === '' || value === false || value === null) next.delete(key);
            else next.set(key, String(value));
          });
          if (resetPage && !('page' in patch)) next.delete('page');
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  useEffect(() => {
    if (debouncedSearch !== filters.search) applyFilters({ search: debouncedSearch || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => setSearchInput(filters.search), [filters.search]);

  const queryParams = useMemo(
    () => ({
      page: filters.page,
      limit: PAGE_SIZE,
      sort: filters.sort,
      ...(filters.search && { search: filters.search }),
      ...(filters.category && { category: filters.category }),
      ...(filters.brand && { brand: filters.brand }),
      ...(filters.minPrice && { minPrice: filters.minPrice }),
      ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
      ...(filters.rating && { rating: filters.rating }),
      ...(filters.inStock && { inStock: true }),
    }),
    [filters]
  );

  const products = useApiResource(() => productApi.list(queryParams), [queryParams]);
  // Brand and price options follow the selected category so the rail stays relevant.
  const filterOptions = useApiResource(() => productApi.filters(filters.category ? { category: filters.category } : undefined), [filters.category]);

  const resetFilters = () => setSearchParams({}, { replace: true });

  const categoryNames = filterOptions.data?.categories ?? [];
  const singleCategory =
    filters.category && !filters.category.includes(',')
      ? categoryNames.find((category) => category.slug === filters.category)?.name
      : null;

  const activeChips = [
    ...filters.category.split(',').filter(Boolean).map((slug) => ({
      key: `category:${slug}`,
      label: categoryNames.find((category) => category.slug === slug)?.name ?? slug,
      remove: () => applyFilters({ category: filters.category.split(',').filter((v) => v && v !== slug).join(',') || undefined }),
    })),
    ...filters.brand.split(',').filter(Boolean).map((brand) => ({
      key: `brand:${brand}`,
      label: brand,
      remove: () => applyFilters({ brand: filters.brand.split(',').filter((v) => v && v !== brand).join(',') || undefined }),
    })),
    ...(filters.minPrice || filters.maxPrice
      ? [{ key: 'price', label: `₹${filters.minPrice || 0} – ₹${filters.maxPrice || '∞'}`, remove: () => applyFilters({ minPrice: undefined, maxPrice: undefined }) }]
      : []),
    ...(filters.rating ? [{ key: 'rating', label: `${filters.rating}★ & up`, remove: () => applyFilters({ rating: undefined }) }] : []),
    ...(filters.inStock ? [{ key: 'inStock', label: 'In stock', remove: () => applyFilters({ inStock: undefined }) }] : []),
  ];

  const explicitSort = searchParams.get('sort');
  const title = filters.search
    ? `Results for “${filters.search}”`
    : singleCategory ?? (explicitSort ? SORT_TITLES[explicitSort] : null) ?? 'All products';

  const sidebarProps = { filters, options: filterOptions.data, onChange: applyFilters, onReset: resetFilters };
  const sidebar = <FilterSidebar {...sidebarProps} />;

  return (
    <div>
      {/* Page banner */}
      <div className="relative overflow-hidden border-b border-ink-200/70 bg-surface">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-200/50 blur-3xl" aria-hidden="true" />
        <div className="container-wide relative py-8 sm:py-10">
          <p className="eyebrow">Catalogue</p>
          <h1 className="mt-2 text-balance">{title}</h1>
          <p className="mt-2 text-ink-500">
            {products.meta
              ? `${products.meta.total} product${products.meta.total === 1 ? '' : 's'} available`
              : 'Browse the full catalogue'}
          </p>
        </div>
      </div>

      <div className="container-wide py-6 sm:py-8">
        {/* Toolbar */}
        <div className="sticky top-16 z-30 -mx-4 mb-6 border-y border-ink-200/70 bg-canvas/85 px-4 py-3 backdrop-blur-xl sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none lg:top-[72px]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="group relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 transition group-focus-within:text-brand-600">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.2-3.2" strokeLinecap="round" /></svg>
              </span>
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by product name or brand…"
                aria-label="Filter these results by product name or brand"
                className="input-base h-12 rounded-2xl pl-11 pr-4"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="lg" className="lg:hidden" onClick={() => setFiltersOpen(true)} aria-label="Open filters">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
                Filters
                {activeChips.length > 0 && (
                  <span className="ml-0.5 rounded-full bg-brand-600 px-1.5 text-xs font-bold text-white">{activeChips.length}</span>
                )}
              </Button>

              <Select
                value={filters.sort}
                onChange={(event) => applyFilters({ sort: event.target.value })}
                aria-label="Sort products"
                containerClassName="w-full sm:w-48"
                className="h-12 rounded-2xl"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {activeChips.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2 animate-fade-in">
            {activeChips.map((chip) => (
              <span key={chip.key} className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 py-1.5 pl-3.5 pr-1.5 text-sm font-semibold text-brand-700">
                {chip.label}
                <button type="button" onClick={chip.remove} className="rounded-full p-1 transition hover:bg-brand-200" aria-label={`Remove ${chip.label} filter`}>
                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M6.3 5l3.7 3.7L13.7 5 15 6.3 11.3 10 15 13.7 13.7 15 10 11.3 6.3 15 5 13.7 8.7 10 5 6.3z" /></svg>
                </button>
              </span>
            ))}
            <button type="button" onClick={resetFilters} className="ml-1 text-sm font-semibold text-ink-500 underline-offset-4 hover:text-ink-800 hover:underline">
              Clear all
            </button>
          </div>
        )}

        <div className="flex gap-8 xl:gap-10">
          <aside className="hidden w-[300px] shrink-0 lg:block xl:w-[320px]">
            <div className="sticky top-24">{sidebar}</div>
          </aside>

          <div className="min-w-0 flex-1">
            <ProductGrid
              products={products.data?.products}
              loading={products.loading}
              error={products.error}
              onRetry={products.reload}
              skeletonCount={PAGE_SIZE}
              columns="auto"
              emptyTitle="No products match these filters"
              emptyDescription="Try removing a filter or searching for something else."
              emptyAction={<Button variant="outline" onClick={resetFilters}>Clear all filters</Button>}
            />

            {products.meta && (
              <Pagination
                meta={products.meta}
                onPageChange={(page) => {
                  applyFilters({ page }, { resetPage: false });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="mt-10"
              />
            )}
          </div>
        </div>
      </div>

      <Modal open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters" description="Narrow down the catalogue" size="md">
        <FilterSidebar {...sidebarProps} hideHeader className="border-0 p-0 shadow-none" />
        <div className="sticky bottom-0 -mx-6 -mb-6 mt-4 flex gap-2 border-t border-ink-100 bg-surface px-6 py-4">
          {activeChips.length > 0 && (
            <Button variant="outline" size="lg" onClick={resetFilters}>Clear</Button>
          )}
          <Button fullWidth size="lg" onClick={() => setFiltersOpen(false)}>
            Show {products.meta?.total ?? 0} results
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ProductsPage;
