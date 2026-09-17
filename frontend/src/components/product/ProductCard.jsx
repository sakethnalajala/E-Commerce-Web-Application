import { useState } from 'react';
import { Link } from 'react-router-dom';
import cn from '@/utils/cn';
import { formatCurrency, discountPercent } from '@/utils/format';
import { Rating } from '@/components/ui/Rating';
import useCart from '@/hooks/useCart';
import ProductImage from '@/components/product/ProductImage';

const ProductCard = ({ product, className }) => {
  const { addItem, mutating } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const price = product.effectivePrice ?? product.discountPrice ?? product.price;
  const discount = discountPercent(product.price, product.discountPrice);
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 5;
  const href = `/products/${product.slug ?? product._id}`;

  const handleAdd = async (event) => {
    // The card is a link; keep the button from navigating.
    event.preventDefault();
    event.stopPropagation();
    if (adding) return;

    setAdding(true);
    const ok = await addItem(product, 1);
    setAdding(false);

    if (ok) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1400);
    }
  };

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-3xl border border-ink-200/80 bg-surface shadow-card',
        'transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-lift',
        className
      )}
    >
      <Link to={href} className="flex flex-1 flex-col" aria-label={product.name}>
        <div className="relative aspect-[4/4.2] overflow-hidden bg-ink-100">
          <ProductImage
            src={product.images?.[0]}
            alt={product.name}
            category={product.category}
            className="transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />

          {/* Soft vignette so badges stay legible on bright photos */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-night-400/25 to-transparent" aria-hidden="true" />

          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {discount > 0 && (
              <span className="rounded-full bg-accent-400 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-night-400 shadow-glow-gold">
                −{discount}%
              </span>
            )}
            {product.isFeatured && (
              <span className="rounded-full bg-surface/90 px-2.5 py-1 text-[11px] font-bold text-ink-900 backdrop-blur">
                Featured
              </span>
            )}
          </div>

          {/* Quick-add overlay on hover (desktop) */}
          {!outOfStock && (
            <div className="pointer-events-none absolute inset-x-3 bottom-3 hidden translate-y-3 opacity-0 transition-all duration-300 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 sm:block">
              <button
                type="button"
                onClick={handleAdd}
                disabled={mutating}
                className={cn(
                  'flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold shadow-lift transition-all active:scale-[0.98]',
                  added ? 'bg-success-600 text-white' : 'bg-surface/95 text-ink-900 backdrop-blur hover:bg-brand-600 hover:text-white'
                )}
              >
                {added ? (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                    Added to cart
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16l-1.2 9.6a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.7L4 6Z" /><circle cx="9" cy="20" r="1.2" /><circle cx="17" cy="20" r="1.2" /></svg>
                    {adding ? 'Adding…' : 'Quick add'}
                  </>
                )}
              </button>
            </div>
          )}

          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface/70 backdrop-blur-[2px]">
              <span className="rounded-full bg-ink-900 px-3.5 py-1.5 text-xs font-bold text-surface">Sold out</span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4 pb-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">{product.brand}</p>
            {product.category?.name && (
              <span className="truncate text-[11px] font-medium text-ink-400">{product.category.name}</span>
            )}
          </div>

          <h3 className="mt-1.5 line-clamp-2 text-[15px] font-semibold leading-snug text-ink-900 transition-colors group-hover:text-brand-700">
            {product.name}
          </h3>

          <div className="mt-2">
            <Rating value={product.ratingsAverage} size="xs" count={product.ratingsCount} />
          </div>

          <div className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-3">
            <span className="font-display text-lg font-bold tracking-tight text-ink-900">{formatCurrency(price)}</span>
            {discount > 0 && (
              <span className="text-[13px] text-ink-400 line-through">{formatCurrency(product.price)}</span>
            )}
          </div>

          {lowStock && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-warning-600">
              <span className="h-1.5 w-1.5 rounded-full bg-warning-500 animate-pulse-soft" />
              Only {product.stock} left
            </p>
          )}
        </div>
      </Link>

      {/* Persistent action on touch devices (hover overlay is desktop-only) */}
      <div className="px-4 pb-4 sm:hidden">
        <button
          type="button"
          onClick={handleAdd}
          disabled={outOfStock || mutating}
          className={cn(
            'inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition active:scale-[0.98]',
            outOfStock
              ? 'cursor-not-allowed bg-ink-100 text-ink-400'
              : added
                ? 'bg-success-600 text-white'
                : 'bg-brand-600 text-white hover:bg-brand-700'
          )}
        >
          {outOfStock ? 'Sold out' : added ? 'Added ✓' : 'Add to cart'}
        </button>
      </div>
    </article>
  );
};

/** Matching placeholder so the grid does not jump while loading. */
export const ProductCardSkeleton = () => (
  <div className="overflow-hidden rounded-3xl border border-ink-200/80 bg-surface">
    <div className="skeleton aspect-[4/4.2] rounded-none" />
    <div className="space-y-2.5 p-4">
      <div className="skeleton h-3 w-16" />
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-4 w-2/3" />
      <div className="skeleton h-3 w-24" />
      <div className="skeleton h-6 w-20" />
    </div>
  </div>
);

export default ProductCard;
