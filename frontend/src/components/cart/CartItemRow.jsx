import { useState } from 'react';
import { Link } from 'react-router-dom';
import cn from '@/utils/cn';
import { formatCurrency, discountPercent } from '@/utils/format';
import QuantityStepper from '@/components/product/QuantityStepper';
import ProductImage from '@/components/product/ProductImage';

/**
 * One cart line: image, details, quantity control and line total.
 * Removal collapses the row before the parent drops it, so the list reflows
 * smoothly instead of snapping.
 */
const CartItemRow = ({ item, onQuantityChange, onRemove, disabled }) => {
  const { product, quantity, unitPrice, subtotal, maxQuantity } = item;
  const discount = discountPercent(product.price, unitPrice);
  const atStockLimit = quantity >= maxQuantity;
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    const ok = await onRemove(product._id);
    if (!ok) setRemoving(false);
  };

  return (
    <li
      className={cn(
        'grid grid-cols-[88px,1fr] gap-4 rounded-2xl border border-ink-200/80 bg-surface p-4 transition-all duration-300 sm:grid-cols-[112px,1fr]',
        removing && 'scale-[0.98] opacity-0'
      )}
    >
      <Link
        to={`/products/${product.slug ?? product._id}`}
        className="group relative aspect-square overflow-hidden rounded-xl border border-ink-100 bg-ink-100"
      >
        <ProductImage src={product.image} alt={product.name} category={product.category} className="transition duration-500 group-hover:scale-105" />
        {discount > 0 && (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-accent-400 px-1.5 py-0.5 text-[10px] font-extrabold text-night-400">
            −{discount}%
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">{product.brand}</p>
            <Link
              to={`/products/${product.slug ?? product._id}`}
              className="mt-0.5 line-clamp-2 text-[15px] font-semibold leading-snug text-ink-900 transition hover:text-brand-700"
            >
              {product.name}
            </Link>
            <p className="mt-1 text-sm text-ink-500">
              {formatCurrency(unitPrice)}
              {discount > 0 && <span className="ml-2 text-xs text-ink-400 line-through">{formatCurrency(product.price)}</span>}
              <span className="text-ink-400"> · each</span>
            </p>
          </div>

          <p className="shrink-0 font-display text-base font-bold text-ink-900 sm:text-lg">{formatCurrency(subtotal)}</p>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
          <div className="flex items-center gap-3">
            <QuantityStepper
              size="sm"
              value={quantity}
              max={maxQuantity}
              disabled={disabled || removing}
              onChange={(next) => onQuantityChange(product._id, next)}
            />
            {atStockLimit && <span className="text-xs font-semibold text-warning-600">Max stock</span>}
          </div>

          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled || removing}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-ink-500 transition hover:bg-danger-50 hover:text-danger-600 disabled:opacity-50"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13" /><path d="M9 7V4h6v3" /></svg>
            Remove
          </button>
        </div>
      </div>
    </li>
  );
};

export default CartItemRow;
