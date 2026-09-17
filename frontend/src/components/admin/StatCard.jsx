import { Link } from 'react-router-dom';
import cn from '@/utils/cn';

const TONES = {
  brand: 'bg-brand-50 text-brand-600',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  danger: 'bg-danger-50 text-danger-600',
  info: 'bg-info-50 text-info-600',
  neutral: 'bg-ink-100 text-ink-600',
};

const ACCENTS = {
  brand: 'from-brand-500/15',
  success: 'from-success-500/15',
  warning: 'from-warning-500/15',
  danger: 'from-danger-500/15',
  info: 'from-info-500/15',
  neutral: 'from-ink-500/10',
};

/**
 * Single KPI tile for the dashboard and analytics pages. `trend` (a number,
 * positive or negative) renders a delta pill when supplied.
 */
const StatCard = ({ label, value, hint, icon, tone = 'brand', to, loading, trend, className }) => {
  const body = (
    <>
      <div className={cn('pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br to-transparent blur-2xl', ACCENTS[tone])} aria-hidden="true" />

      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[13px] font-semibold text-ink-500">{label}</p>
        {icon && (
          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', TONES[tone])}>{icon}</span>
        )}
      </div>

      {loading ? (
        <div className="skeleton relative mt-3 h-8 w-28" />
      ) : (
        <p className="relative mt-2 break-words font-display text-xl font-bold tracking-tight text-ink-900 sm:text-[28px] lg:text-3xl">{value}</p>
      )}

      <div className="relative mt-1.5 flex items-center gap-2">
        {typeof trend === 'number' && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold',
              trend >= 0 ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'
            )}
          >
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
        {hint && <p className="text-xs text-ink-400">{hint}</p>}
      </div>
    </>
  );

  const classes = cn(
    'relative overflow-hidden rounded-2xl border border-ink-200/80 bg-surface p-5 shadow-card transition-all duration-300',
    to && 'hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift',
    className
  );

  return to ? (
    <Link to={to} className={classes}>{body}</Link>
  ) : (
    <div className={classes}>{body}</div>
  );
};

export const statIcon = (paths) => (
  <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {paths}
  </svg>
);

export default StatCard;
