import { formatCurrency } from '@/utils/format';
import cn from '@/utils/cn';

const Row = ({ label, value, tone, bold }) => (
  <div className="flex items-center justify-between gap-4 text-sm">
    <span className={cn('text-ink-600', bold && 'font-semibold text-ink-900')}>{label}</span>
    <span
      className={cn(
        'font-semibold text-ink-900 tabular-nums',
        tone === 'success' && 'text-success-600',
        bold && 'font-display text-xl font-bold'
      )}
    >
      {value}
    </span>
  </div>
);

/**
 * Money panel shared by the cart and checkout pages. Values come from the
 * server; `isEstimate` marks a guest cart where shipping and tax are pending.
 */
const OrderSummary = ({ summary, title = 'Order summary', footer, className }) => {
  const { subtotal = 0, savings = 0, shipping = 0, tax = 0, total = 0, taxRate, isEstimate } = summary ?? {};
  const progress =
    summary?.freeShippingThreshold ? Math.min(100, (subtotal / summary.freeShippingThreshold) * 100) : 100;

  return (
    <div className={cn('overflow-hidden rounded-3xl border border-ink-200/80 bg-surface shadow-card', className)}>
      <div className="border-b border-ink-100 px-6 py-4">
        <h2 className="font-display text-base font-bold text-ink-900">{title}</h2>
      </div>

      <div className="space-y-3.5 px-6 py-5">
        <Row label={`Subtotal · ${summary?.totalQuantity ?? 0} item${summary?.totalQuantity === 1 ? '' : 's'}`} value={formatCurrency(subtotal)} />

        {savings > 0 && <Row label="You save" value={`− ${formatCurrency(savings)}`} tone="success" />}

        {isEstimate ? (
          <p className="rounded-xl bg-ink-50 px-3.5 py-2.5 text-xs leading-relaxed text-ink-500">
            Shipping and tax are calculated once you log in — your cart is saved.
          </p>
        ) : (
          <>
            <Row label="Shipping" value={shipping === 0 ? 'Free' : formatCurrency(shipping)} tone={shipping === 0 ? 'success' : undefined} />
            <Row label={`Tax${taxRate ? ` (${Math.round(taxRate * 100)}%)` : ''}`} value={formatCurrency(tax)} />
          </>
        )}

        {summary?.freeShippingThreshold > 0 && !isEstimate && (
          <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-3.5 py-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-brand-700">
                {summary.amountToFreeShipping > 0
                  ? `${formatCurrency(summary.amountToFreeShipping)} away from free shipping`
                  : 'Free shipping unlocked'}
              </span>
              <span className="text-brand-500">{Math.round(progress)}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400 transition-[width] duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="border-t border-dashed border-ink-200 pt-4">
          <Row label="Total" value={formatCurrency(total)} bold />
          <p className="mt-1 text-xs text-ink-400">Inclusive of all taxes · Cash on delivery</p>
        </div>
      </div>

      {footer && <div className="border-t border-ink-100 bg-ink-50/50 px-6 py-5">{footer}</div>}
    </div>
  );
};

export default OrderSummary;
