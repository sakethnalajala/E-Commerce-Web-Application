import { NavLink } from 'react-router-dom';
import cn from '@/utils/cn';
import useCart from '@/hooks/useCart';
import useAuth from '@/hooks/useAuth';

const icon = (paths) => (
  <svg className="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {paths}
  </svg>
);

/**
 * Thumb-reachable bottom navigation, phones only. The mobile layout is built
 * around this bar rather than shrinking the desktop header.
 */
const MobileTabBar = () => {
  const { itemCount } = useCart();
  const { isAuthenticated } = useAuth();

  const tabs = [
    { to: '/', label: 'Home', end: true, icon: icon(<><path d="M4 11l8-7 8 7" /><path d="M6 10v9h12v-9" /></>) },
    { to: '/products', label: 'Shop', icon: icon(<><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.2-3.2" /></>) },
    {
      to: '/cart',
      label: 'Cart',
      badge: itemCount,
      icon: icon(<><path d="M4 6h16l-1.2 9.6a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.7L4 6Z" /><circle cx="9" cy="20" r="1.2" /><circle cx="17" cy="20" r="1.2" /></>),
    },
    {
      to: isAuthenticated ? '/orders' : '/login',
      label: isAuthenticated ? 'Orders' : 'Log in',
      icon: icon(<><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M8 12h8M8 16h5" /></>),
    },
    {
      to: isAuthenticated ? '/dashboard' : '/register',
      label: isAuthenticated ? 'Account' : 'Sign up',
      icon: icon(<><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>),
    },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200/70 bg-surface/90 backdrop-blur-xl sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Primary"
    >
      <div className="grid grid-cols-5">
        {tabs.map((tab) => (
          <NavLink
            key={tab.label}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center gap-1 py-2 text-[11px] font-semibold transition-colors',
                isActive ? 'text-brand-700' : 'text-ink-500'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'relative flex h-8 w-12 items-center justify-center rounded-full transition-all duration-300',
                    isActive && 'bg-brand-50'
                  )}
                >
                  {tab.icon}
                  {tab.badge > 0 && (
                    <span className="absolute -right-0.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </span>
                {tab.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileTabBar;
