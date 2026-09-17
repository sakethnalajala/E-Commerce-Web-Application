import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import cn from '@/utils/cn';
import { initials } from '@/utils/format';
import { categoryApi } from '@/api';
import useApiResource from '@/hooks/useApiResource';
import useAuth from '@/hooks/useAuth';
import useCart from '@/hooks/useCart';
import { LoadingBlock } from '@/components/ui/Spinner';

const icon = (paths, className = 'h-[19px] w-[19px]') => (
  <svg className={cn('shrink-0', className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {paths}
  </svg>
);

const ICONS = {
  dashboard: icon(<><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>),
  profile: icon(<><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>),
  addresses: icon(<><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></>),
  settings: icon(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>),
  shop: icon(<><path d="M3 9.5 5 4h14l2 5.5" /><path d="M3 9.5h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0v-2Z" /><path d="M5 13v7h14v-7" /><path d="M10 20v-4h4v4" /></>),
  categories: icon(<><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="8" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /><rect x="13" y="13" width="8" height="8" rx="2" /></>),
  orders: icon(<><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M8 12h8M8 16h5" /></>),
  cart: icon(<><path d="M4 6h16l-1.2 9.6a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.7L4 6Z" /><circle cx="9" cy="20" r="1.2" /><circle cx="17" cy="20" r="1.2" /></>),
  reviews: icon(<><path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8L6.8 19.2l1-5.9L3.5 9.2l5.9-.8L12 3z" /></>),
  support: icon(<><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.5" /><path d="M12 17h.01" /></>),
  logout: icon(<><path d="M15 12H4m0 0 3.5-3.5M4 12l3.5 3.5" /><path d="M11 7V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2v-2" /></>),
  chevron: icon(<path d="m6 9 6 6 6-6" />, 'h-4 w-4'),
  menu: icon(<path d="M4 7h16M4 12h16M4 17h10" />, 'h-5 w-5'),
  close: icon(<path d="M6 6l12 12M18 6L6 18" />, 'h-5 w-5'),
};

/** Small glyph per category so the expanded list scans quickly. */
const CATEGORY_GLYPHS = [
  { match: /electronic/i, path: <><rect x="3" y="5" width="18" height="12" rx="2" /><path d="M8 21h8M12 17v4" /></> },
  { match: /book/i, path: <><path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4V4Z" /><path d="M20 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8V4Z" /></> },
  { match: /fashion|cloth/i, path: <><path d="M9 3 5.5 5 3 10l3 1v10h12V11l3-1-2.5-5L15 3a3 3 0 0 1-6 0Z" /></> },
  { match: /beauty|care/i, path: <><path d="M9 3h6v4H9zM8 7h8l1 14H7L8 7Z" /><path d="M10 12h4" /></> },
  { match: /home|kitchen/i, path: <><path d="M4 11l8-7 8 7" /><path d="M6 10v10h12V10" /><path d="M10 20v-5h4v5" /></> },
  { match: /sport|fitness/i, path: <><path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12" /></> },
];
const glyphFor = (name) => icon((CATEGORY_GLYPHS.find((g) => g.match.test(name)) ?? { path: <circle cx="12" cy="12" r="4" /> }).path, 'h-4 w-4');

/**
 * Customer account navigation. Deliberately a different shape from the admin
 * sidebar: a light, card-style rail grouped into Account / Shopping / Help,
 * with a collapsible category tree under "Categories". Every entry is a real
 * page backed by the API.
 */
const NAV = [
  {
    group: 'Account',
    items: [
      { to: '/dashboard', label: 'Dashboard', end: true, icon: ICONS.dashboard },
      { to: '/profile', label: 'My profile', icon: ICONS.profile },
      { to: '/addresses', label: 'Addresses', icon: ICONS.addresses },
      { to: '/settings', label: 'Account settings', icon: ICONS.settings },
    ],
  },
  {
    group: 'Shopping',
    items: [
      { to: '/products', label: 'Shop', icon: ICONS.shop, matchExact: true },
      { id: 'categories', label: 'Categories', icon: ICONS.categories, tree: true },
      { to: '/orders', label: 'My orders', icon: ICONS.orders },
      { to: '/cart', label: 'Shopping cart', badge: 'cart', icon: ICONS.cart },
      { to: '/reviews', label: 'My reviews', icon: ICONS.reviews },
    ],
  },
  {
    group: 'Help',
    items: [{ to: '/support', label: 'Help & support', icon: ICONS.support }],
  },
];

const AccountLayout = () => {
  const { user, logout } = useAuth();
  const { summary } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const categories = useApiResource(() => categoryApi.list(), []);
  const categoryList = categories.data?.categories ?? [];

  const activeCategory = location.pathname === '/products' ? searchParams.get('category') : null;
  const [categoriesOpen, setCategoriesOpen] = useState(Boolean(activeCategory));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const cartCount = summary?.totalQuantity ?? 0;

  // Keep the tree open while a category is selected; close the drawer on navigation.
  useEffect(() => {
    if (activeCategory) setCategoriesOpen(true);
    setDrawerOpen(false);
  }, [location.pathname, location.search, activeCategory]);

  // Lock scroll while the mobile drawer is open.
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

  const isShopActive = location.pathname === '/products' && !activeCategory;

  const badge = (item, isActive) =>
    item.badge === 'cart' && cartCount > 0 ? (
      <span className={cn('ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums', isActive ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-700')}>
        {cartCount}
      </span>
    ) : null;

  const linkClass = (isActive) =>
    cn(
      'group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-semibold transition-all duration-200',
      isActive ? 'bg-brand-600 text-white shadow-glow-sm' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
    );

  /** One entry of the rail (also used inside the mobile drawer). */
  const renderItem = (item) => {
    if (item.tree) {
      const open = categoriesOpen;
      const highlighted = Boolean(activeCategory) && !open;
      return (
        <div key={item.id}>
          <button
            type="button"
            onClick={() => setCategoriesOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="account-category-tree"
            className={cn(linkClass(highlighted), 'justify-between')}
          >
            <span className="flex items-center gap-3">
              <span className={cn('transition-colors', highlighted ? 'text-white' : 'text-ink-400 group-hover:text-brand-600')}>{item.icon}</span>
              {item.label}
            </span>
            <span className={cn('transition-transform duration-300', highlighted ? 'text-white/80' : 'text-ink-400', open && 'rotate-180')}>{ICONS.chevron}</span>
          </button>
          <div
            id="account-category-tree"
            className={cn('grid transition-[grid-template-rows,opacity] duration-300 ease-out', open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}
          >
            <div className="overflow-hidden">
              <ul className="ml-4 mt-1 space-y-0.5 border-l border-ink-200 pl-3">
                {categories.loading && !categoryList.length && [0, 1, 2].map((i) => <li key={i} className="skeleton my-1 h-8 rounded-lg" />)}
                {categoryList.map((category) => {
                  const active = activeCategory === category.slug;
                  return (
                    <li key={category._id}>
                      <Link
                        to={`/products?category=${category.slug}`}
                        aria-current={active ? 'page' : undefined}
                        tabIndex={open ? 0 : -1}
                        className={cn(
                          'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                          active ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
                        )}
                      >
                        <span className={active ? 'text-brand-600' : 'text-ink-400'}>{glyphFor(category.name)}</span>
                        <span className="truncate">{category.name}</span>
                        {typeof category.productCount === 'number' && (
                          <span className="ml-auto text-[11px] tabular-nums text-ink-400">{category.productCount}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      );
    }

    if (item.matchExact) {
      return (
        <Link key={item.to} to={item.to} aria-current={isShopActive ? 'page' : undefined} className={linkClass(isShopActive)}>
          <span className={cn('transition-colors', isShopActive ? 'text-white' : 'text-ink-400 group-hover:text-brand-600')}>{item.icon}</span>
          {item.label}
        </Link>
      );
    }

    return (
      <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => linkClass(isActive)}>
        {({ isActive }) => (
          <>
            <span className={cn('transition-colors', isActive ? 'text-white' : 'text-ink-400 group-hover:text-brand-600')}>{item.icon}</span>
            <span className="truncate">{item.label}</span>
            {badge(item, isActive)}
          </>
        )}
      </NavLink>
    );
  };

  const rail = (
    <>
      <div className="flex items-center gap-3 px-1">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-gradient text-sm font-bold text-white shadow-glow-sm">
          {user?.avatar?.url ? <img src={user.avatar.url} alt="" className="h-full w-full object-cover" /> : initials(user?.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold text-ink-900">{user?.name}</p>
          <p className="truncate text-xs text-ink-500">{user?.email}</p>
        </div>
      </div>

      <nav className="mt-5 space-y-5" aria-label="Account sections">
        {NAV.map((section) => (
          <div key={section.group}>
            <p className="mb-1.5 px-3.5 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-400">{section.group}</p>
            <div className="space-y-0.5">{section.items.map(renderItem)}</div>
          </div>
        ))}
      </nav>

      <div className="mt-5 space-y-2 border-t border-ink-100 pt-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[15px] font-semibold text-danger-600 transition hover:bg-danger-50"
        >
          <span className="text-danger-500">{ICONS.logout}</span>
          Log out
        </button>
        <Link
          to="/products"
          className="flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
        >
          ← Continue shopping
        </Link>
      </div>
    </>
  );

  return (
    <div className="container-wide py-6 sm:py-8 lg:py-10">
      <div className="grid gap-6 lg:grid-cols-[300px,minmax(0,1fr)] lg:gap-8 xl:grid-cols-[320px,minmax(0,1fr)] xl:gap-10">
        {/* ---------- Desktop rail ---------- */}
        <aside className="hidden lg:block" aria-label="Account navigation">
          <div className="sticky top-24 rounded-3xl border border-ink-200/80 bg-surface p-4 shadow-card">{rail}</div>
        </aside>

        {/* ---------- Mobile / tablet: menu button + drawer ---------- */}
        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={drawerOpen}
            className="flex w-full items-center justify-between rounded-2xl border border-ink-200/80 bg-surface px-4 py-3 text-left shadow-card transition hover:border-ink-300"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">{ICONS.menu}</span>
              <span>
                <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-ink-400">My account</span>
                <span className="block text-sm font-bold text-ink-900">Account menu</span>
              </span>
            </span>
            <span className="text-ink-400">{ICONS.chevron}</span>
          </button>

          {drawerOpen && (
            <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Account navigation">
              <button type="button" className="absolute inset-0 bg-night-500/60 backdrop-blur-sm animate-fade-in" onClick={() => setDrawerOpen(false)} aria-label="Close menu" />
              <div className="absolute inset-y-0 left-0 flex w-[88vw] max-w-sm flex-col bg-surface shadow-popover animate-slide-in-left">
                <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
                  <p className="text-sm font-bold text-ink-900">My account</p>
                  <button type="button" onClick={() => setDrawerOpen(false)} className="rounded-xl p-2 text-ink-500 transition hover:bg-ink-100" aria-label="Close menu">
                    {ICONS.close}
                  </button>
                </div>
                <div className="scrollbar-thin flex-1 overflow-y-auto p-4">{rail}</div>
              </div>
            </div>
          )}
        </div>

        {/* ---------- Content ---------- */}
        <div className="min-w-0">
          <Suspense fallback={<LoadingBlock label="Loading…" className="min-h-[40vh]" />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default AccountLayout;
