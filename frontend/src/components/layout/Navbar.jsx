import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import cn from '@/utils/cn';
import { initials } from '@/utils/format';
import { categoryApi } from '@/api';
import useApiResource from '@/hooks/useApiResource';
import useAuth from '@/hooks/useAuth';
import useCart from '@/hooks/useCart';
import Button from '@/components/ui/Button';
import ThemeToggle from '@/components/common/ThemeToggle';
import Logo from './Logo';

const GUEST_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/products', label: 'Shop', end: true },
  { to: '/products?sort=popular', label: 'Best sellers' },
  { to: '/products?sort=newest', label: 'New arrivals' },
];

/* Signed-in customers get their portal in the main nav instead of promo links. */
const CUSTOMER_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/products', label: 'Shop', end: true },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/orders', label: 'My orders' },
];

const Icon = ({ path, className = 'h-5 w-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {path}
  </svg>
);

const SearchIcon = ({ className }) => (
  <Icon className={className} path={<><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.2-3.2" /></>} />
);

/** Matches a nav link against the current path + query so "Best sellers" is active on ?sort=popular. */
const useIsActive = () => {
  const location = useLocation();
  return (to, end) => {
    const [path, query] = to.split('?');
    if (query) return location.pathname === path && location.search.includes(query);
    if (end) return location.pathname === path && !location.search;
    return location.pathname.startsWith(path);
  };
};

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const isActive = useIsActive();

  const categories = useApiResource(() => categoryApi.list(), []);

  const [term, setTerm] = useState(searchParams.get('search') ?? '');
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [bump, setBump] = useState(false);

  const accountRef = useRef(null);
  const categoriesRef = useRef(null);
  const previousCount = useRef(itemCount);

  useEffect(() => setTerm(searchParams.get('search') ?? ''), [searchParams]);

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
    setCategoriesOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) setAccountOpen(false);
      if (categoriesRef.current && !categoriesRef.current.contains(event.target)) setCategoriesOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Pop the cart badge when the count grows.
  useEffect(() => {
    if (itemCount > previousCount.current) {
      setBump(true);
      const timer = setTimeout(() => setBump(false), 400);
      previousCount.current = itemCount;
      return () => clearTimeout(timer);
    }
    previousCount.current = itemCount;
    return undefined;
  }, [itemCount]);

  // Lock scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleSearch = (event) => {
    event.preventDefault();
    const query = term.trim();
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : '/products');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const desktopLink = (link) => {
    const active = isActive(link.to, link.end);
    return (
      <Link
        key={link.label}
        to={link.to}
        className={cn(
          'relative rounded-full px-3.5 py-2 text-sm font-semibold transition-colors duration-200',
          active ? 'text-brand-700' : 'text-ink-600 hover:text-ink-900'
        )}
      >
        {active && <span className="absolute inset-0 -z-10 rounded-full bg-brand-50 animate-fade-in" />}
        {link.label}
      </Link>
    );
  };

  const categoryList = categories.data?.categories ?? [];
  const NAV_LINKS = isAuthenticated && !isAdmin ? CUSTOMER_LINKS : GUEST_LINKS;

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 transition-all duration-300',
          scrolled
            ? 'border-b border-ink-200/70 bg-surface/85 shadow-[0_8px_30px_-18px_rgb(15_23_42/0.35)] backdrop-blur-xl'
            : 'border-b border-transparent bg-surface/70 backdrop-blur-lg'
        )}
      >
        <div className="container-page">
          <div className="flex h-16 items-center gap-2 sm:gap-3 lg:h-[72px] lg:gap-5">
            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="-ml-2 rounded-xl p-2 text-ink-600 transition hover:bg-ink-100 active:scale-95 lg:hidden"
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
            >
              <Icon path={<><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h10" /></>} />
            </button>

            <Logo />

            {/* Desktop navigation */}
            <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
              {NAV_LINKS.slice(0, 2).map(desktopLink)}

              {/* Categories dropdown */}
              <div className="relative" ref={categoriesRef}>
                <button
                  type="button"
                  onClick={() => setCategoriesOpen((open) => !open)}
                  className={cn(
                    'flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors',
                    categoriesOpen || location.search.includes('category=')
                      ? 'text-brand-700'
                      : 'text-ink-600 hover:text-ink-900'
                  )}
                  aria-expanded={categoriesOpen}
                  aria-haspopup="menu"
                >
                  Categories
                  <Icon className={cn('h-4 w-4 transition-transform duration-200', categoriesOpen && 'rotate-180')} path={<path d="M6 9l6 6 6-6" />} />
                </button>

                {categoriesOpen && (
                  <div
                    role="menu"
                    className="absolute left-1/2 top-full z-50 mt-3 w-[520px] -translate-x-1/2 overflow-hidden rounded-3xl border border-ink-200/80 bg-surface p-2 shadow-popover animate-scale-in"
                  >
                    <div className="grid grid-cols-2 gap-1">
                      {categoryList.length === 0 && (
                        <p className="col-span-2 px-4 py-6 text-center text-sm text-ink-400">No categories yet.</p>
                      )}
                      {categoryList.map((category) => (
                        <Link
                          key={category._id}
                          to={`/products?category=${category.slug}`}
                          role="menuitem"
                          className="group flex items-start gap-3 rounded-2xl px-3.5 py-3 transition hover:bg-brand-50"
                        >
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                            <Icon className="h-4 w-4" path={<><path d="M20 7.5 12 3 4 7.5v9L12 21l8-4.5v-9Z" /><path d="M4 7.5 12 12l8-4.5M12 12v9" /></>} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-ink-900">{category.name}</span>
                            <span className="block truncate text-xs text-ink-500">
                              {category.productCount ?? 0} products
                            </span>
                          </span>
                        </Link>
                      ))}
                    </div>
                    <Link
                      to="/products"
                      className="mt-1 flex items-center justify-between rounded-2xl bg-ink-50 px-4 py-3 text-sm font-semibold text-ink-700 transition hover:bg-brand-600 hover:text-white"
                    >
                      Browse everything
                      <Icon className="h-4 w-4" path={<path d="M5 12h14M13 6l6 6-6 6" />} />
                    </Link>
                  </div>
                )}
              </div>

              {NAV_LINKS.slice(2).map(desktopLink)}
            </nav>

            {/* Desktop search */}
            <form onSubmit={handleSearch} className="ml-auto hidden max-w-sm flex-1 md:block" role="search">
              <div className="group relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 transition group-focus-within:text-brand-600">
                  <SearchIcon className="h-4 w-4" />
                </span>
                <input
                  type="search"
                  value={term}
                  onChange={(event) => setTerm(event.target.value)}
                  placeholder="Search products, brands…"
                  aria-label="Search products"
                  className="h-10 w-full rounded-full border border-ink-200 bg-ink-50/80 pl-10 pr-4 text-sm text-ink-900 transition-all duration-300 placeholder:text-ink-400 hover:bg-surface focus:border-brand-400 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-brand-500/15"
                />
                <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-ink-200 bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-ink-400 xl:block">
                  Enter
                </kbd>
              </div>
            </form>

            <div className="ml-auto flex items-center gap-1 md:ml-0">
              <ThemeToggle className="hidden sm:inline-flex" />
              <Link
                to="/cart"
                className="relative rounded-xl p-2 text-ink-600 transition hover:bg-ink-100 active:scale-95"
                aria-label={`Cart with ${itemCount} item${itemCount === 1 ? '' : 's'}`}
              >
                <Icon path={<><path d="M4 6h16l-1.2 9.6a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.7L4 6Z" /><circle cx="9" cy="20" r="1.2" /><circle cx="17" cy="20" r="1.2" /></>} />
                {itemCount > 0 && (
                  <span
                    className={cn(
                      'absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white shadow-glow-sm ring-2 ring-white',
                      bump && 'animate-pop'
                    )}
                  >
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>

              {isAuthenticated ? (
                <div className="relative ml-1" ref={accountRef}>
                  <button
                    type="button"
                    onClick={() => setAccountOpen((open) => !open)}
                    className="flex items-center gap-2 rounded-full border border-ink-200 bg-surface py-1 pl-1 pr-2.5 shadow-soft transition hover:border-ink-300 hover:shadow-card active:scale-[0.98]"
                    aria-expanded={accountOpen}
                    aria-haspopup="menu"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-gradient text-[11px] font-bold text-white">
                      {user?.avatar?.url ? (
                        <img src={user.avatar.url} alt="" className="h-full w-full rounded-full object-cover" />
                      ) : (
                        initials(user?.name)
                      )}
                    </span>
                    <span className="hidden max-w-24 truncate text-sm font-semibold text-ink-700 sm:block">
                      {user?.name?.split(' ')[0]}
                    </span>
                    <Icon className={cn('hidden h-3.5 w-3.5 text-ink-400 transition-transform sm:block', accountOpen && 'rotate-180')} path={<path d="M6 9l6 6 6-6" />} />
                  </button>

                  {accountOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-full z-50 mt-2.5 w-64 overflow-hidden rounded-2xl border border-ink-200/80 bg-surface shadow-popover animate-scale-in"
                    >
                      <div className="border-b border-ink-100 bg-ink-50/60 px-4 py-3.5">
                        <p className="truncate text-sm font-bold text-ink-900">{user?.name}</p>
                        <p className="truncate text-xs text-ink-500">{user?.email}</p>
                      </div>
                      <div className="p-1.5">
                        {isAdmin && (
                          <Link to="/admin" role="menuitem" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50">
                            <Icon className="h-4 w-4" path={<><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>} />
                            Admin console
                          </Link>
                        )}
                        {!isAdmin && (
                          <Link to="/dashboard" role="menuitem" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50">
                            <Icon className="h-4 w-4" path={<><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>} />
                            My dashboard
                          </Link>
                        )}
                        <Link to="/profile" role="menuitem" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-ink-700 transition hover:bg-ink-100">
                          <Icon className="h-4 w-4" path={<><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>} />
                          My account
                        </Link>
                        <Link to="/orders" role="menuitem" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-ink-700 transition hover:bg-ink-100">
                          <Icon className="h-4 w-4" path={<><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M8 12h8M8 16h5" /></>} />
                          My orders
                        </Link>
                        {!isAdmin && (
                          <Link to="/admin/login" role="menuitem" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-ink-500 transition hover:bg-ink-100 hover:text-ink-800">
                            <Icon className="h-4 w-4" path={<><path d="M12 3 4 6.5v5c0 4.6 3.4 8.4 8 9.5 4.6-1.1 8-4.9 8-9.5v-5L12 3Z" /></>} />
                            Admin sign-in
                          </Link>
                        )}
                        <div className="my-1 border-t border-ink-100" />
                        <button type="button" onClick={handleLogout} role="menuitem" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-danger-600 transition hover:bg-danger-50">
                          <Icon className="h-4 w-4" path={<><path d="M15 12H4m0 0 3.5-3.5M4 12l3.5 3.5" /><path d="M11 7V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2v-2" /></>} />
                          Log out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="ml-1 flex items-center gap-2">
                  <Button to="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
                    Log in
                  </Button>
                  <Button to="/register" size="sm">
                    Sign up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-night-400/60 backdrop-blur-sm animate-fade-in" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 flex w-[86vw] max-w-sm flex-col bg-surface shadow-popover animate-slide-in-left">
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
              <Logo />
              <button type="button" onClick={() => setMenuOpen(false)} className="rounded-xl p-2 text-ink-500 transition hover:bg-ink-100" aria-label="Close menu">
                <Icon path={<path d="M6 6l12 12M18 6L6 18" />} />
              </button>
            </div>

            <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-4">
              <form onSubmit={handleSearch} role="search">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">
                    <SearchIcon className="h-4 w-4" />
                  </span>
                  <input
                    type="search"
                    value={term}
                    onChange={(event) => setTerm(event.target.value)}
                    placeholder="Search products…"
                    aria-label="Search products (mobile)"
                    className="input-base h-11 rounded-full pl-10"
                  />
                </div>
              </form>

              <nav className="mt-4 grid gap-1" aria-label="Mobile">
                {NAV_LINKS.map((link) => (
                  <NavLink
                    key={link.label}
                    to={link.to}
                    end={link.end}
                    className={({ isActive: active }) =>
                      cn(
                        'rounded-xl px-3.5 py-3 text-[15px] font-semibold transition',
                        active && !location.search ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-100'
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>

              <p className="mt-5 px-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-400">Categories</p>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {categoryList.map((category) => (
                  <Link
                    key={category._id}
                    to={`/products?category=${category.slug}`}
                    className="rounded-xl border border-ink-200 px-3 py-2.5 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="border-t border-ink-100 p-4">
              <div className="mb-3 flex items-center justify-between rounded-xl bg-ink-50 px-3 py-1">
                <span className="text-sm font-semibold text-ink-700">Appearance</span>
                <ThemeToggle showLabel />
              </div>
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">
                    {initials(user?.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink-900">{user?.name}</p>
                    <Link to={isAdmin ? '/admin' : '/dashboard'} className="text-xs font-medium text-brand-600">
                      {isAdmin ? 'Open admin console' : 'Open my dashboard'}
                    </Link>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    Log out
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button to="/login" variant="outline">
                    Log in
                  </Button>
                  <Button to="/register">Sign up</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
