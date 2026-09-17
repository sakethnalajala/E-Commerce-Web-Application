import { useEffect, useState } from 'react';
import cn from '@/utils/cn';
import Button from './Button';

/** Counts down from the API's Retry-After so a 429 never turns into a retry loop. */
const useRetryCountdown = (error) => {
  const seconds = error?.isRateLimited ? error.retryAfterSeconds : 0;
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
    if (!seconds) return undefined;
    const timer = setInterval(() => setRemaining((value) => (value > 1 ? value - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [seconds, error]);

  return remaining;
};

/* Small inline illustrations so empty/error states do not depend on assets. */
const EmptyIllustration = () => (
  <svg viewBox="0 0 120 96" className="h-24 w-32" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="emptyGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ddd6fe" />
        <stop offset="100%" stopColor="#c4b5fd" />
      </linearGradient>
    </defs>
    <ellipse cx="60" cy="86" rx="42" ry="6" fill="#e2e8f0" />
    <rect x="26" y="30" width="68" height="48" rx="10" fill="url(#emptyGrad)" />
    <rect x="26" y="30" width="68" height="14" rx="7" fill="#7c3aed" opacity="0.9" />
    <path d="M46 30v-6a14 14 0 0 1 28 0v6" stroke="#6d28d9" strokeWidth="3" strokeLinecap="round" fill="none" />
    <circle cx="50" cy="58" r="3" fill="#4c1d95" />
    <circle cx="70" cy="58" r="3" fill="#4c1d95" />
    <path d="M52 68q8 4 16 0" stroke="#4c1d95" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <circle cx="98" cy="22" r="4" fill="#fbbf24" />
    <circle cx="20" cy="40" r="2.5" fill="#a78bfa" />
    <circle cx="106" cy="52" r="2" fill="#a78bfa" />
  </svg>
);

const ErrorIllustration = () => (
  <svg viewBox="0 0 120 96" className="h-24 w-32" fill="none" aria-hidden="true">
    <ellipse cx="60" cy="86" rx="42" ry="6" fill="#fee2e2" />
    <path d="M60 14 104 76H16z" fill="#fecaca" />
    <path d="M60 24 94 72H26z" fill="#ef4444" />
    <rect x="57" y="40" width="6" height="16" rx="3" fill="#fff" />
    <circle cx="60" cy="63" r="3.2" fill="#fff" />
  </svg>
);

/** Neutral empty state: no data yet, or filters matched nothing. */
export const EmptyState = ({ title = 'Nothing here yet', description, icon, action, className, compact = false }) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink-300/80 bg-surface/70 px-6 text-center animate-fade-in',
      compact ? 'py-10' : 'py-16',
      className
    )}
  >
    <div className="mb-5 animate-float">{icon ?? <EmptyIllustration />}</div>
    <h3 className="text-base font-bold text-ink-900">{title}</h3>
    {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-500">{description}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

/** Failure state with a retry affordance. */
export const ErrorState = ({ title = 'Something went wrong', error, onRetry, className }) => {
  const message = typeof error === 'string' ? error : error?.message || 'Please try again in a moment.';
  const isOffline = error?.isNetworkError;
  const isRateLimited = error?.isRateLimited;
  const remaining = useRetryCountdown(error);
  const heading = isOffline ? 'Connection problem' : isRateLimited ? 'Slow down for a moment' : title;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-3xl border border-danger-500/15 bg-danger-50/40 px-6 py-14 text-center animate-fade-in',
        className
      )}
    >
      <div className="mb-5">
        <ErrorIllustration />
      </div>
      <h3 className="text-base font-bold text-ink-900">{heading}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink-600">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-6" onClick={onRetry} disabled={remaining > 0} aria-live="polite">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
          {remaining > 0 ? `Try again in ${remaining}s` : 'Try again'}
        </Button>
      )}
    </div>
  );
};

/** Inline alert used inside forms and panels. */
export const Alert = ({ tone = 'info', title, children, className, onDismiss }) => {
  const tones = {
    info: 'border-brand-500/20 bg-brand-50 text-brand-900',
    success: 'border-success-500/20 bg-success-50 text-success-700',
    warning: 'border-warning-500/25 bg-warning-50 text-warning-700',
    error: 'border-danger-500/20 bg-danger-50 text-danger-700',
  };
  const icons = {
    info: <><path d="M12 11v5" /><path d="M12 7.5h.01" /><circle cx="12" cy="12" r="9" /></>,
    success: <><circle cx="12" cy="12" r="9" /><path d="M8.5 12.2l2.4 2.4 4.6-4.8" /></>,
    warning: <><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.8 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.8a2 2 0 0 0-3.4 0Z" /></>,
    error: <><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" /></>,
  };

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm animate-fade-down', tones[tone], className)}
    >
      <svg className="mt-0.5 h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {icons[tone]}
      </svg>
      <div className="min-w-0 flex-1 leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        <div className={cn(title && 'mt-0.5')}>{children}</div>
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="-m-1 rounded-lg p-1 opacity-60 transition hover:opacity-100" aria-label="Dismiss">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M6.3 5l3.7 3.7L13.7 5 15 6.3 11.3 10 15 13.7 13.7 15 10 11.3 6.3 15 5 13.7 8.7 10 5 6.3z" />
          </svg>
        </button>
      )}
    </div>
  );
};

export const Skeleton = ({ className }) => <div className={cn('skeleton', className)} />;

export default EmptyState;
