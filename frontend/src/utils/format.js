import { CURRENCY } from '@/constants';

/**
 * Whole amounts print without decimals (₹1,349); anything with paise prints both
 * digits (₹134.90, never ₹134.9).
 */
const wholeCurrencyFormatter = new Intl.NumberFormat(CURRENCY.locale, {
  style: 'currency',
  currency: CURRENCY.code,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const preciseCurrencyFormatter = new Intl.NumberFormat(CURRENCY.locale, {
  style: 'currency',
  currency: CURRENCY.code,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat(CURRENCY.locale, {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const formatCurrency = (value) => {
  const amount = Number(value) || 0;
  const hasFraction = Math.abs(amount % 1) > 0.0001;
  return hasFraction ? preciseCurrencyFormatter.format(amount) : wholeCurrencyFormatter.format(amount);
};



/** Compact money for dashboard tiles and chart axes: ₹1.2L, ₹45.3K. */
export const formatCurrencyCompact = (value) => {
  const amount = Number(value) || 0;
  if (Math.abs(amount) < 10000) return formatCurrency(amount);
  return `₹${compactFormatter.format(amount)}`;
};

export const formatNumber = (value) =>
  new Intl.NumberFormat(CURRENCY.locale).format(Number(value) || 0);

export const formatDate = (value, options = {}) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(CURRENCY.locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  });
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString(CURRENCY.locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** "3 days ago" / "in 2 hours" for order timelines. */
export const formatRelativeTime = (value) => {
  if (!value) return '—';

  const diffMs = new Date(value).getTime() - Date.now();
  const units = [
    ['year', 1000 * 60 * 60 * 24 * 365],
    ['month', 1000 * 60 * 60 * 24 * 30],
    ['day', 1000 * 60 * 60 * 24],
    ['hour', 1000 * 60 * 60],
    ['minute', 1000 * 60],
  ];

  const formatter = new Intl.RelativeTimeFormat(CURRENCY.locale, { numeric: 'auto' });

  for (const [unit, ms] of units) {
    if (Math.abs(diffMs) >= ms) return formatter.format(Math.round(diffMs / ms), unit);
  }

  return 'just now';
};

export const discountPercent = (price, discountPrice) => {
  if (!discountPrice || discountPrice >= price) return 0;
  return Math.round(((price - discountPrice) / price) * 100);
};

export const truncate = (text, length = 80) => {
  if (!text) return '';
  return text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;
};

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

/** Short YYYY-MM -> "Mar 2026" for chart axes. */
export const formatMonthLabel = (month) => {
  if (!month) return '';
  const [year, monthIndex] = month.split('-');
  const date = new Date(Number(year), Number(monthIndex) - 1, 1);
  return date.toLocaleDateString(CURRENCY.locale, { month: 'short', year: '2-digit' });
};

export const formatDayLabel = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString(CURRENCY.locale, { day: 'numeric', month: 'short' });
};
