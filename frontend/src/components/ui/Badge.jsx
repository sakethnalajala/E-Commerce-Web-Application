import cn from '@/utils/cn';
import { ORDER_STATUS } from '@/constants';

const TONES = {
  neutral: 'bg-ink-100 text-ink-700 ring-ink-500/10',
  brand: 'bg-brand-50 text-brand-700 ring-brand-500/20',
  gold: 'bg-accent-100 text-accent-700 ring-accent-500/25',
  success: 'bg-success-50 text-success-700 ring-success-500/20',
  warning: 'bg-warning-50 text-warning-700 ring-warning-500/25',
  danger: 'bg-danger-50 text-danger-700 ring-danger-500/20',
  info: 'bg-info-50 text-info-700 ring-info-500/20',
  dark: 'bg-night-200 text-white ring-white/10',
};

export const Badge = ({ tone = 'neutral', className, children, dot = false, size = 'sm' }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset',
      size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-[13px]',
      TONES[tone],
      className
    )}
  >
    {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
    {children}
  </span>
);

/* Each status has its own colour AND icon, so state never rests on colour alone. */
const STATUS_META = {
  [ORDER_STATUS.PENDING]: {
    classes: 'bg-warning-50 text-warning-700 ring-warning-500/25',
    icon: <><circle cx="12" cy="12" r="8.5" /><path d="M12 8v4.5l2.8 1.7" /></>,
  },
  [ORDER_STATUS.CONFIRMED]: {
    classes: 'bg-brand-50 text-brand-700 ring-brand-500/20',
    icon: <><circle cx="12" cy="12" r="8.5" /><path d="M8.5 12.2l2.4 2.4 4.6-4.8" /></>,
  },
  [ORDER_STATUS.SHIPPED]: {
    classes: 'bg-info-50 text-info-700 ring-info-500/20',
    icon: <><rect x="2.5" y="7" width="12" height="9" rx="1.5" /><path d="M14.5 10h3.4l3.1 3.2V16h-6.5" /><circle cx="7" cy="17.5" r="1.6" /><circle cx="17" cy="17.5" r="1.6" /></>,
  },
  [ORDER_STATUS.DELIVERED]: {
    classes: 'bg-success-50 text-success-700 ring-success-500/20',
    icon: <><path d="M20 7.5 12 3 4 7.5v9L12 21l8-4.5v-9Z" /><path d="M9 12.2l2 2 4-4.2" /></>,
  },
  [ORDER_STATUS.CANCELLED]: {
    classes: 'bg-danger-50 text-danger-700 ring-danger-500/20',
    icon: <><circle cx="12" cy="12" r="8.5" /><path d="M9 9l6 6M15 9l-6 6" /></>,
  },
};

/** Order status pill — consistent across customer and admin views. */
export const StatusBadge = ({ status, className, size = 'sm' }) => {
  const meta = STATUS_META[status] ?? { classes: TONES.neutral, icon: null };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-[13px]',
        meta.classes,
        className
      )}
    >
      {meta.icon && (
        <svg
          className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {meta.icon}
        </svg>
      )}
      {status}
    </span>
  );
};

/** Stock indicator shared by product cards, tables and the detail page. */
export const StockBadge = ({ stock, lowStockThreshold = 10, className, size = 'sm' }) => {
  if (stock <= 0) {
    return (
      <Badge tone="danger" dot size={size} className={className}>
        Out of stock
      </Badge>
    );
  }

  if (stock <= lowStockThreshold) {
    return (
      <Badge tone="warning" dot size={size} className={className}>
        Only {stock} left
      </Badge>
    );
  }

  return (
    <Badge tone="success" dot size={size} className={className}>
      In stock
    </Badge>
  );
};

export default Badge;
