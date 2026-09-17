import { Link, Outlet, useLocation } from 'react-router-dom';
import Logo from '@/components/layout/Logo';
import { Aurora } from '@/components/common/Motion';
import ThemeToggle from '@/components/common/ThemeToggle';

const HIGHLIGHTS = [
  { title: 'Curated catalogue', text: 'Six categories, hand-picked products, honest pricing.' },
  { title: 'Track every step', text: 'Confirmed, shipped, delivered — live from your account.' },
  { title: 'Checkout in seconds', text: 'Saved addresses and cash on delivery. No card needed.' },
];

/**
 * Credential pages: the form column stays usable on a phone; the animated
 * brand panel appears from `lg` up. Each route remounts the form with a
 * short entrance.
 */
const AuthLayout = () => {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen bg-surface">
      <div className="relative flex w-full flex-col px-5 py-8 sm:px-10 lg:w-[46%] lg:px-16 xl:px-24">

        <div className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link to="/" className="rounded-xl px-2 py-1.5 text-sm font-semibold text-ink-500 transition hover:text-ink-900">
              ← Back to store
            </Link>
          </div>
        </div>

        <div className="flex flex-1 items-center py-10">
          <div key={pathname} className="mx-auto w-full max-w-md animate-fade-up">
            <Outlet />
          </div>
        </div>

        <p className="text-center text-xs text-ink-400">
          Protected by JWT authentication · Passwords are hashed with bcrypt
        </p>
      </div>

      <div className="relative hidden w-[54%] overflow-hidden bg-night-400 lg:block noise">
        <Aurora intensity={1.1} />

        <div className="relative flex h-full flex-col justify-between p-14 xl:p-20 text-white">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-success-500 animate-pulse-soft" />
            Trusted by shoppers across India
          </div>

          <div>
            <h2 className="font-display text-5xl font-extrabold leading-[1.05] tracking-[-0.03em] text-white xl:text-6xl">
              Shop smarter,
              <br />
              <span className="gradient-text">not harder.</span>
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-white/65">
              Thousands of products, honest prices and a checkout that takes under a minute.
            </p>

            <ul className="mt-10 space-y-5">
              {HIGHLIGHTS.map((item, index) => (
                <li
                  key={item.title}
                  className="flex items-start gap-4 animate-fade-up"
                  style={{ animationDelay: `${200 + index * 120}ms` }}
                >
                  <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl glass text-brand-200">
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 10.5l3.5 3.5L15 7" />
                    </svg>
                  </span>
                  <span>
                    <span className="block font-semibold text-white">{item.title}</span>
                    <span className="block text-[15px] text-white/60">{item.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Floating product-style cards for depth */}
          <div className="relative h-36" aria-hidden="true">
            <div className="glass absolute bottom-0 left-0 w-56 rounded-2xl p-4 animate-float">
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-xl bg-brand-gradient-soft" />
                <div className="flex-1 space-y-1.5">
                  <span className="block h-2.5 w-24 rounded-full bg-white/50" />
                  <span className="block h-2 w-16 rounded-full bg-white/25" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="h-2.5 w-14 rounded-full bg-accent-400/80" />
                <span className="rounded-full bg-success-500/20 px-2 py-0.5 text-[10px] font-bold text-success-500">In stock</span>
              </div>
            </div>
            <div className="glass absolute bottom-10 left-52 w-48 rounded-2xl p-4 animate-float [animation-delay:1.2s]">
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">Order status</span>
              <span className="mt-1.5 block text-sm font-semibold text-white">Out for delivery</span>
              <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                <span className="block h-full w-3/4 rounded-full bg-gradient-to-r from-brand-400 to-accent-400" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
