import cn from '@/utils/cn';

const SIZES = { xs: 'h-3 w-3', sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8', xl: 'h-12 w-12' };

const Spinner = ({ size = 'md', className, label = 'Loading' }) => (
  <svg
    className={cn('animate-spin', SIZES[size], className)}
    viewBox="0 0 24 24"
    fill="none"
    role="status"
    aria-label={label}
  >
    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" />
    <path
      className="opacity-90"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      d="M12 2a10 10 0 0 1 10 10"
    />
  </svg>
);

/** Full-area loading state for page and panel bodies. */
export const LoadingBlock = ({ label = 'Loading…', className }) => (
  <div
    className={cn('flex flex-col items-center justify-center gap-4 py-20 text-ink-500 animate-fade-in', className)}
    role="status"
    aria-live="polite"
  >
    <span className="relative flex h-14 w-14 items-center justify-center">
      <span className="absolute inset-0 rounded-full bg-brand-500/15 animate-pulse-soft" />
      <Spinner size="lg" className="relative text-brand-600" />
    </span>
    <p className="text-sm font-medium">{label}</p>
  </div>
);

export default Spinner;
