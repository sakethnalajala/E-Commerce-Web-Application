import useTheme from '@/hooks/useTheme';
import cn from '@/utils/cn';

const SunIcon = (
  <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

const MoonIcon = (
  <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
);

/**
 * Light/dark switch. `variant` matches the surface it sits on: "light" for
 * the storefront header, "onDark" for the admin sidebar and dark panels.
 * The label announces the *next* theme, which is what the button does.
 */
const ThemeToggle = ({ variant = 'light', className, showLabel = false }) => {
  const { isDark, toggleTheme } = useTheme();
  const next = isDark ? 'light' : 'dark';
  const label = `Switch to ${next} theme`;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      aria-pressed={isDark}
      className={cn(
        'group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl transition-all duration-200 active:scale-95',
        showLabel ? 'h-11 px-3.5 text-sm font-semibold' : 'h-10 w-10',
        variant === 'light' && 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
        variant === 'onDark' && 'text-white/70 hover:bg-white/10 hover:text-white',
        className
      )}
    >
      <span className="relative flex h-[18px] w-[18px] items-center justify-center">
        <span className={cn('absolute inset-0 flex items-center justify-center transition-all duration-300', isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-50 opacity-0')}>{SunIcon}</span>
        <span className={cn('absolute inset-0 flex items-center justify-center transition-all duration-300', isDark ? '-rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100')}>{MoonIcon}</span>
      </span>
      {showLabel && <span>{isDark ? 'Light theme' : 'Dark theme'}</span>}
    </button>
  );
};

export default ThemeToggle;
