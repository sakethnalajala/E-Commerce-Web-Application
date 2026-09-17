import { useEffect, useState } from 'react';
import cn from '@/utils/cn';
import { formatCurrency } from '@/utils/format';
import Button from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Input';
import { Rating } from '@/components/ui/Rating';

const Section = ({ title, count, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-ink-100 py-4 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-bold text-ink-900">
          {title}
          {count > 0 && (
            <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{count}</span>
          )}
        </span>
        <svg
          className={cn('h-4 w-4 text-ink-400 transition-transform duration-200', open && 'rotate-180')}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path fillRule="evenodd" d="M5.2 7.2a1 1 0 011.4 0L10 10.6l3.4-3.4a1 1 0 111.4 1.4l-4.1 4.1a1 1 0 01-1.4 0L5.2 8.6a1 1 0 010-1.4z" clipRule="evenodd" />
        </svg>
      </button>
      <div className={cn('grid transition-[grid-template-rows] duration-300 ease-out', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="overflow-hidden">
          <div className="pt-3.5">{children}</div>
        </div>
      </div>
    </div>
  );
};

/**
 * Catalogue filters. Emits a partial filter patch through `onChange`; the page
 * owns the state and mirrors it into the URL.
 */
const FilterSidebar = ({ filters, options, onChange, onReset, className, hideHeader = false }) => {
  const { categories = [], brands = [], priceRange = { minPrice: 0, maxPrice: 0 } } = options ?? {};

  const [minPrice, setMinPrice] = useState(filters.minPrice ?? '');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice ?? '');

  useEffect(() => {
    setMinPrice(filters.minPrice ?? '');
    setMaxPrice(filters.maxPrice ?? '');
  }, [filters.minPrice, filters.maxPrice]);

  const selectedCategories = filters.category ? filters.category.split(',').filter(Boolean) : [];
  const selectedBrands = filters.brand ? filters.brand.split(',').filter(Boolean) : [];

  const toggleValue = (key, list, value) => {
    const next = list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
    onChange({ [key]: next.join(',') || undefined });
  };

  const applyPrice = () => {
    onChange({
      minPrice: minPrice === '' ? undefined : Number(minPrice),
      maxPrice: maxPrice === '' ? undefined : Number(maxPrice),
    });
  };

  const activeCount =
    selectedCategories.length +
    selectedBrands.length +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.rating ? 1 : 0) +
    (filters.inStock ? 1 : 0);

  return (
    <div className={cn('rounded-3xl border border-ink-200/80 bg-surface p-5 shadow-card', className)}>
      <div className={cn('flex items-center justify-between', hideHeader && 'hidden')}>
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink-900">
          <svg className="h-4 w-4 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          Filters
        </h2>
        {activeCount > 0 && (
          <button type="button" onClick={onReset} className="text-sm font-semibold text-brand-600 transition hover:text-brand-700">
            Clear ({activeCount})
          </button>
        )}
      </div>

      <div className={cn(!hideHeader && 'mt-2')}>
        <Section title="Category" count={selectedCategories.length}>
          <div className="space-y-2.5">
            {categories.length === 0 && <p className="text-sm text-ink-400">No categories yet.</p>}
            {categories.map((category) => (
              <Checkbox
                key={category._id}
                label={category.name}
                checked={selectedCategories.includes(category.slug)}
                onChange={() => toggleValue('category', selectedCategories, category.slug)}
              />
            ))}
          </div>
        </Section>

        <Section title="Brand" count={selectedBrands.length}>
          <div className="scrollbar-thin max-h-56 space-y-2.5 overflow-y-auto pr-1">
            {brands.length === 0 && <p className="text-sm text-ink-400">No brands yet.</p>}
            {brands.map((brand) => (
              <Checkbox
                key={brand}
                label={brand}
                checked={selectedBrands.includes(brand)}
                onChange={() => toggleValue('brand', selectedBrands, brand)}
              />
            ))}
          </div>
        </Section>

        <Section title="Price" count={filters.minPrice || filters.maxPrice ? 1 : 0}>
          <p className="mb-3 text-xs text-ink-500">
            Catalogue spans {formatCurrency(priceRange.minPrice)} – {formatCurrency(priceRange.maxPrice)}
          </p>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">₹</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                onBlur={applyPrice}
                onKeyDown={(event) => event.key === 'Enter' && applyPrice()}
                placeholder="Min"
                aria-label="Minimum price"
                className="input-base h-10 pl-7 pr-2 text-sm"
              />
            </div>
            <span className="text-ink-300">—</span>
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">₹</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                onBlur={applyPrice}
                onKeyDown={(event) => event.key === 'Enter' && applyPrice()}
                placeholder="Max"
                aria-label="Maximum price"
                className="input-base h-10 pl-7 pr-2 text-sm"
              />
            </div>
          </div>
          <Button variant="subtle" size="sm" className="mt-3 w-full" onClick={applyPrice}>
            Apply price
          </Button>
        </Section>

        <Section title="Rating" count={filters.rating ? 1 : 0}>
          <div className="space-y-1">
            {[4, 3, 2].map((rating) => {
              const selected = Number(filters.rating) === rating;
              return (
                <button
                  key={rating}
                  type="button"
                  onClick={() => onChange({ rating: selected ? undefined : rating })}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-sm transition',
                    selected ? 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200' : 'text-ink-600 hover:bg-ink-50'
                  )}
                  aria-pressed={selected}
                >
                  <Rating value={rating} size="xs" />
                  <span className="font-medium">& up</span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Availability" count={filters.inStock ? 1 : 0}>
          <Checkbox
            label="In stock only"
            description="Hide products that are currently sold out"
            checked={Boolean(filters.inStock)}
            onChange={(event) => onChange({ inStock: event.target.checked ? true : undefined })}
          />
        </Section>
      </div>
    </div>
  );
};

export default FilterSidebar;
