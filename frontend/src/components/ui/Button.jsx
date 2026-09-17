import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import cn from '@/utils/cn';
import Spinner from './Spinner';

const VARIANTS = {
  primary:
    'bg-brand-600 text-white shadow-glow-sm hover:bg-brand-700 hover:shadow-glow active:bg-brand-800 disabled:bg-brand-300 disabled:shadow-none',
  secondary:
    'bg-ink-900 text-surface shadow-soft hover:bg-ink-800 active:bg-ink-700 disabled:bg-ink-400',
  outline:
    'border border-ink-200 bg-surface text-ink-800 shadow-soft hover:border-ink-300 hover:bg-ink-50 active:bg-ink-100 disabled:text-ink-400',
  ghost: 'text-ink-700 hover:bg-ink-100 active:bg-ink-200 disabled:text-ink-400',
  danger: 'bg-danger-600 text-white shadow-soft hover:bg-danger-700 active:bg-danger-700 disabled:bg-danger-500/50',
  subtle: 'bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200 disabled:text-brand-300',
  success: 'bg-success-600 text-white shadow-soft hover:bg-success-700 disabled:bg-success-500/50',
  gold: 'bg-gold-gradient text-[#0b0f1a] shadow-glow-gold hover:brightness-105 active:brightness-95 disabled:opacity-60',

  // On saturated / dark surfaces (hero, auth panel, admin sidebar).
  // Sits on dark gradient banners in both themes, so it uses fixed colours.
  onBrand: 'bg-white text-[#5b21b6] shadow-lift hover:bg-[#f5f3ff] active:bg-[#ede9fe]',
  onBrandOutline: 'border border-white/30 bg-white/5 text-white backdrop-blur hover:bg-white/12 active:bg-white/16',
  onDark: 'bg-white/10 text-white ring-1 ring-inset ring-white/15 hover:bg-white/15 active:bg-white/20',
};

const SIZES = {
  xs: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  sm: 'h-9 px-3.5 text-sm gap-2 rounded-lg',
  md: 'h-11 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-[15px] gap-2.5 rounded-xl',
  xl: 'h-14 px-8 text-base gap-3 rounded-2xl',
  icon: 'h-10 w-10 rounded-xl',
  'icon-sm': 'h-8 w-8 rounded-lg',
};

/**
 * One button for the whole app. Renders an <a>/<Link> when given `to`/`href`
 * so navigation stays semantic. Press feedback is a tiny scale on :active.
 */
const Button = forwardRef(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      fullWidth = false,
      className,
      children,
      to,
      href,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const classes = cn(
      'group/btn relative inline-flex select-none items-center justify-center whitespace-nowrap font-semibold',
      'transition-all duration-200 ease-out active:scale-[0.98]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:active:scale-100',
      VARIANTS[variant],
      SIZES[size],
      fullWidth && 'w-full',
      className
    );

    const content = (
      <>
        {loading && (
          <Spinner
            size="sm"
            className={variant === 'outline' || variant === 'ghost' ? 'text-ink-500' : 'text-current'}
          />
        )}
        {children}
      </>
    );

    if (to) {
      return (
        <Link ref={ref} to={to} className={classes} {...props}>
          {content}
        </Link>
      );
    }

    if (href) {
      return (
        <a ref={ref} href={href} className={classes} {...props}>
          {content}
        </a>
      );
    }

    return (
      <button ref={ref} type={type} className={classes} disabled={disabled || loading} {...props}>
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';

/** Small inline icon button for toolbars, cards and table rows. */
export const IconButton = forwardRef(({ label, className, size = 'icon', variant = 'ghost', ...props }, ref) => (
  <Button ref={ref} size={size} variant={variant} aria-label={label} title={label} className={className} {...props} />
));
IconButton.displayName = 'IconButton';

export default Button;
