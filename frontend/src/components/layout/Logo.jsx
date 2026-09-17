import { Link } from 'react-router-dom';
import cn from '@/utils/cn';
import { APP_NAME } from '@/constants';

/** Brand mark + wordmark. `tone` flips the wordmark for dark surfaces. */
export const LogoMark = ({ className }) => (
  <span
    className={cn(
      'relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-gradient text-white shadow-glow-sm',
      className
    )}
    aria-hidden="true"
  >
    <span className="absolute inset-0 bg-shine bg-[length:200%_100%] opacity-0 transition group-hover/logo:animate-shine group-hover/logo:opacity-100" />
    <svg className="relative h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16l-1.3 11a2 2 0 0 1-2 1.8H7.3a2 2 0 0 1-2-1.8L4 7Z" />
      <path d="M8.5 9.5V6a3.5 3.5 0 1 1 7 0v3.5" />
    </svg>
  </span>
);

const Logo = ({ to = '/', tone = 'light', subtitle, className }) => (
  <Link to={to} className={cn('group/logo flex items-center gap-2.5', className)} aria-label={`${APP_NAME} home`}>
    <LogoMark />
    <span className="leading-none">
      <span
        className={cn(
          'block font-display text-[19px] font-extrabold tracking-[-0.02em]',
          tone === 'dark' ? 'text-white' : 'text-ink-900'
        )}
      >
        {APP_NAME}
      </span>
      {subtitle && (
        <span className={cn('mt-1 block text-[11px] font-semibold uppercase tracking-[0.14em]', tone === 'dark' ? 'text-white/50' : 'text-ink-400')}>
          {subtitle}
        </span>
      )}
    </span>
  </Link>
);

export default Logo;
