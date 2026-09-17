import { useLocation, useNavigate } from 'react-router-dom';
import cn from '@/utils/cn';

/**
 * "Go back" that never dead-ends: uses browser history when this tab has some,
 * otherwise falls back to `fallback` (the storefront by default). React Router
 * tracks the history index in `location.state.idx`, so a page opened directly
 * from a link/bookmark (idx 0) goes to the fallback instead of leaving the app.
 */
const BackButton = ({ fallback = '/', label = 'Back', className, variant = 'ghost' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    const canGoBack = typeof window !== 'undefined' && (window.history.state?.idx ?? 0) > 0;
    if (canGoBack) navigate(-1);
    else navigate(fallback);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'group inline-flex items-center gap-1.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95',
        variant === 'ghost' && 'px-2 py-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900',
        variant === 'outline' && 'h-10 border border-ink-200 bg-surface px-3.5 text-ink-700 shadow-soft hover:border-ink-300 hover:bg-ink-50',
        variant === 'onDark' && 'px-2 py-1.5 text-white/70 hover:bg-white/10 hover:text-white',
        className
      )}
      aria-label={label}
      data-from={location.pathname}
    >
      <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 12H5M11 18l-6-6 6-6" />
      </svg>
      {label}
    </button>
  );
};

export default BackButton;
