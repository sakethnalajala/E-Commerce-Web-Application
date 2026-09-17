import { Link } from 'react-router-dom';
import { APP_NAME } from '@/constants';
import useAuth from '@/hooks/useAuth';
import Logo from './Logo';

const SECTIONS = [
  {
    title: 'Shop',
    links: [
      { to: '/products', label: 'All products' },
      { to: '/products?sort=newest', label: 'New arrivals' },
      { to: '/products?sort=popular', label: 'Best sellers' },
      { to: '/products?sort=price-asc', label: 'Best value' },
      { to: '/products?inStock=true', label: 'In stock now' },
    ],
  },
];

/** Account column depends on who is looking: guests get sign-in links, members get their pages. */
const accountSection = ({ isAuthenticated, isAdmin }) => ({
  title: 'Account',
  links: isAuthenticated
    ? [
        isAdmin ? { to: '/admin', label: 'Admin console' } : { to: '/dashboard', label: 'My dashboard' },
        { to: '/orders', label: 'Order history' },
        { to: '/cart', label: 'Shopping cart' },
        { to: '/profile', label: 'Profile & addresses' },
      ]
    : [
        { to: '/login', label: 'Log in' },
        { to: '/register', label: 'Create account' },
        { to: '/cart', label: 'Shopping cart' },
        { to: '/orders', label: 'Order history' },
      ],
});

const TRUST = [
  { label: 'Free delivery over ₹999', icon: <><rect x="1" y="6" width="14" height="11" rx="2" /><path d="M15 9h4l3 3.5V17h-7" /><circle cx="6" cy="19" r="2" /><circle cx="18" cy="19" r="2" /></> },
  { label: 'Cash on delivery', icon: <><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></> },
  { label: 'Verified reviews', icon: <><path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8L6.8 19.2l1-5.9L3.5 9.2l5.9-.8L12 3z" /></> },
  { label: 'Cancel before dispatch', icon: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></> },
];

const Footer = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const sections = [...SECTIONS, accountSection({ isAuthenticated, isAdmin })];

  return (
  <footer className="relative mt-auto overflow-hidden bg-night-400 text-white">
    <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-brand-700/40 blur-[120px]" aria-hidden="true" />
    <div className="absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-fuchsia-700/25 blur-[120px]" aria-hidden="true" />

    <div className="container-page relative">
      {/* Trust strip */}
      <div className="grid grid-cols-2 gap-4 border-b border-white/10 py-8 lg:grid-cols-4">
        {TRUST.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-200 ring-1 ring-inset ring-white/10">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {item.icon}
              </svg>
            </span>
            <span className="text-sm font-medium text-white/85">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-12 py-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Logo tone="dark" />
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/60">
            A curated storefront for electronics, fashion, home essentials, fitness gear, books and
            beauty — honest prices, real reviews and delivery you can track from your phone.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {['Electronics', 'Fashion', 'Home', 'Fitness', 'Books', 'Beauty'].map((tag) => (
              <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">{section.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="group inline-flex items-center gap-1.5 text-sm text-white/75 transition hover:text-white">
                      <span className="h-px w-0 bg-brand-300 transition-all duration-300 group-hover:w-3" aria-hidden="true" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="col-span-2 sm:col-span-1">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">Help</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/75">
              <li>Orders ship within 24 hours</li>
              <li>Flat ₹49 delivery under ₹999</li>
              <li>5% tax included at checkout</li>
              <li>Cancel any time before dispatch</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 py-6 text-sm text-white/50 sm:flex-row">
        <p>© {new Date().getFullYear()} {APP_NAME}. Built with React, Express and MongoDB Atlas.</p>
        <div className="flex items-center gap-5">
          <Link to="/admin/login" className="text-white/40 transition hover:text-white/80">Admin sign-in</Link>
          <p className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-success-500 animate-pulse-soft" aria-hidden="true" />
            All systems operational
          </p>
        </div>
      </div>
    </div>
  </footer>
);
};

export default Footer;
