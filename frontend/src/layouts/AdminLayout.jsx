import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import cn from '@/utils/cn';
import { STORAGE_KEYS } from '@/constants';
import { initials } from '@/utils/format';
import { readString, writeString } from '@/utils/storage';
import useAuth from '@/hooks/useAuth';
import { LogoMark } from '@/components/layout/Logo';
import { PageTransition } from '@/components/common/Motion';
import Button from '@/components/ui/Button';
import ThemeToggle from '@/components/common/ThemeToggle';

const icon = (paths) => (
  <svg className="h-[19px] w-[19px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {paths}
  </svg>
);

const NAV = [
  {
    group: 'Overview',
    items: [
      { to: '/admin', label: 'Dashboard', end: true, icon: icon(<><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>) },
      { to: '/admin/analytics', label: 'Analytics', icon: icon(<><path d="M4 19V5" /><path d="M20 19H4" /><path d="M8 16v-5M12 16V8M16 16v-3" /></>) },
      { to: '/admin/reports', label: 'Reports', icon: icon(<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>) },
    ],
  },
  {
    group: 'Catalogue',
    items: [
      { to: '/admin/products', label: 'Products', icon: icon(<><path d="M20 7.5 12 3 4 7.5v9L12 21l8-4.5v-9Z" /><path d="M4 7.5 12 12l8-4.5M12 12v9" /></>) },
      { to: '/admin/categories', label: 'Categories', icon: icon(<><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="8" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /><rect x="13" y="13" width="8" height="8" rx="2" /></>) },
      { to: '/admin/inventory', label: 'Inventory', icon: icon(<><path d="M3 9h18v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9Z" /><path d="M3 9l2-5h14l2 5M10 13h4" /></>) },
      { to: '/admin/reviews', label: 'Reviews', icon: icon(<><path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8L6.8 19.2l1-5.9L3.5 9.2l5.9-.8L12 3z" /></>) },
    ],
  },
  {
    group: 'Sales',
    items: [
      { to: '/admin/orders', label: 'Orders', icon: icon(<><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M8 12h8M8 16h5" /></>) },
      { to: '/admin/users', label: 'Customers', icon: icon(<><circle cx="9" cy="8" r="3.2" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.5a3 3 0 0 1 0 5.8M17 20a6 6 0 0 0-1.6-4" /></>) },
      { to: '/admin/discounts', label: 'Discounts & offers', icon: icon(<><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></>) },
    ],
  },
  {
    group: 'Store',
    items: [
      { to: '/admin/inventory?filter=low', label: 'Low stock alerts', icon: icon(<><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.8 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.8a2 2 0 0 0-3.4 0Z" /></>) },
      { to: '/admin/settings', label: 'Store settings', icon: icon(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>) },
      { to: '/admin/profile', label: 'Admin profile', icon: icon(<><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>) },
    ],
  },
];

const PAGE_TITLES = [
  ['/admin/analytics', 'Analytics'],
  ['/admin/reports', 'Reports'],
  ['/admin/inventory', 'Inventory'],
  ['/admin/reviews', 'Reviews & ratings'],
  ['/admin/discounts', 'Discounts & offers'],
  ['/admin/settings', 'Store settings'],
  ['/admin/profile', 'Admin profile'],
  ['/admin/products/new', 'New product'],
  ['/admin/products', 'Products'],
  ['/admin/categories', 'Categories'],
  ['/admin/orders', 'Orders'],
  ['/admin/users', 'Customers'],
  ['/admin', 'Dashboard'],
];

const COLLAPSE_KEY = `${STORAGE_KEYS.user}.adminSidebar`;

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => readString(COLLAPSE_KEY) === 'collapsed');

  useEffect(() => setDrawerOpen(false), [location.pathname]);
  useEffect(() => {
    writeString(COLLAPSE_KEY, collapsed ? 'collapsed' : 'expanded');
  }, [collapsed]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const pageTitle = PAGE_TITLES.find(([prefix]) => location.pathname.startsWith(prefix))?.[1] ?? 'Admin';

  /**
   * "Low stock alerts" points at /admin/inventory?filter=low. NavLink only
   * compares pathnames, so without this both it and "Inventory" would light up.
   */
  const isItemActive = (item, routeActive) => {
    const [path, query] = item.to.split('?');
    if (query) return location.pathname === path && location.search.includes(query);
    const queriedSibling = NAV.flatMap((group) => group.items).some(
      (other) => other.to.startsWith(`${item.to}?`) && location.search.includes(other.to.split('?')[1])
    );
    return routeActive && !queriedSibling;
  };

  const navItem = (item, showLabels) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      title={showLabels ? undefined : item.label}
      className={({ isActive: routeActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200',
          showLabels ? '' : 'justify-center px-0',
          isItemActive(item, routeActive)
            ? 'bg-white/10 text-white shadow-inner-top'
            : 'text-white/55 hover:bg-white/5 hover:text-white'
        )
      }
    >
      {({ isActive: routeActive }) => (
        <>
          {isItemActive(item, routeActive) && (
            <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-400 shadow-glow-sm" aria-hidden="true" />
          )}
          <span className={cn('transition-colors', isItemActive(item, routeActive) ? 'text-brand-300' : 'text-white/50 group-hover:text-brand-200')}>
            {item.icon}
          </span>
          {showLabels && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  );

  const sidebarBody = (showLabels) => (
    <>
      <div className={cn('flex items-center gap-3 px-2', !showLabels && 'justify-center px-0')}>
        <Link to="/admin" aria-label="Admin dashboard">
          <LogoMark />
        </Link>
        {showLabels && (
          <span className="leading-none">
            <span className="block font-display text-[17px] font-extrabold text-white">ShopSphere</span>
            <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">Admin console</span>
          </span>
        )}
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-6" aria-label="Admin">
        {NAV.map((section) => (
          <div key={section.group}>
            {showLabels && (
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">{section.group}</p>
            )}
            <div className="space-y-1">{section.items.map((item) => navItem(item, showLabels))}</div>
          </div>
        ))}
      </nav>

      <div className={cn('mt-6 space-y-1 border-t border-white/10 pt-4', !showLabels && 'flex flex-col items-center')}>
        <Link
          to="/"
          title="View storefront"
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/55 transition hover:bg-white/5 hover:text-white',
            !showLabels && 'justify-center px-0'
          )}
        >
          {icon(<><path d="M4 11l8-7 8 7" /><path d="M6 10v9h12v-9" /></>)}
          {showLabels && 'View storefront'}
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          title="Log out"
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-white/55 transition hover:bg-danger-500/15 hover:text-danger-500',
            !showLabels && 'justify-center px-0'
          )}
        >
          {icon(<><path d="M15 12H4m0 0 3.5-3.5M4 12l3.5 3.5" /><path d="M11 7V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2v-2" /></>)}
          {showLabels && 'Log out'}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col bg-night-400 py-5 text-white transition-[width] duration-300 ease-out lg:flex',
          collapsed ? 'w-[76px] px-3' : 'w-[264px] px-4'
        )}
      >
        <div className="absolute -left-24 top-0 h-64 w-64 rounded-full bg-brand-700/40 blur-[90px]" aria-hidden="true" />
        <div className="relative flex flex-1 flex-col">{sidebarBody(!collapsed)}</div>

        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="absolute -right-3 top-8 flex h-6 w-6 items-center justify-center rounded-full border border-ink-200 bg-surface text-ink-500 shadow-card transition hover:text-brand-600"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg className={cn('h-3.5 w-3.5 transition-transform', collapsed && 'rotate-180')} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M12.8 4.3a1 1 0 010 1.4L8.5 10l4.3 4.3a1 1 0 01-1.4 1.4l-5-5a1 1 0 010-1.4l5-5a1 1 0 011.4 0z" clipRule="evenodd" />
          </svg>
        </button>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <div className="absolute inset-0 bg-night-400/60 backdrop-blur-sm animate-fade-in" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-night-400 px-4 py-5 text-white animate-slide-in-left">
            <div className="relative flex flex-1 flex-col">{sidebarBody(true)}</div>
          </aside>
        </div>
      )}

      <div className={cn('transition-[padding] duration-300', collapsed ? 'lg:pl-[76px]' : 'lg:pl-[264px]')}>
        <header className="sticky top-0 z-30 border-b border-ink-200/70 bg-surface/85 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="-ml-2 rounded-xl p-2 text-ink-600 transition hover:bg-ink-100 lg:hidden"
              aria-label="Open admin navigation"
            >
              {icon(<><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h10" /></>)}
            </button>

            <nav className="flex min-w-0 items-center gap-2 text-sm" aria-label="Breadcrumb">
              <Link to="/admin" className="font-semibold text-ink-400 transition hover:text-ink-700">Admin</Link>
              <svg className="h-3.5 w-3.5 text-ink-300" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M7.2 15.7a1 1 0 010-1.4L11.5 10 7.2 5.7a1 1 0 011.4-1.4l5 5a1 1 0 010 1.4l-5 5a1 1 0 01-1.4 0z" /></svg>
              <span className="truncate font-bold text-ink-900">{pageTitle}</span>
            </nav>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <Button to="/" variant="outline" size="sm" className="hidden sm:inline-flex">
                {icon(<><path d="M4 11l8-7 8 7" /><path d="M6 10v9h12v-9" /></>)}
                View store
              </Button>
              <div className="flex items-center gap-2.5 rounded-full border border-ink-200 bg-surface py-1 pl-1 pr-3 shadow-soft">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
                  {initials(user?.name)}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-sm font-semibold leading-tight text-ink-900">{user?.name}</span>
                  <span className="block text-[11px] text-ink-500">Administrator</span>
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
