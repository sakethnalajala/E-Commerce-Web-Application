import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';

const SUGGESTIONS = [
  { to: '/products', label: 'Browse all products' },
  { to: '/products?sort=popular', label: 'Best sellers' },
  { to: '/cart', label: 'Your cart' },
  { to: '/orders', label: 'Track an order' },
];

const NotFoundPage = () => (
  <div className="relative overflow-hidden">
    <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-300/40 blur-3xl" aria-hidden="true" />

    <div className="container-page relative flex min-h-[72vh] flex-col items-center justify-center py-16 text-center">
      <p className="gradient-text-brand font-display text-[120px] font-extrabold leading-none tracking-tighter sm:text-[160px] animate-scale-in">
        404
      </p>

      <h1 className="mt-2 animate-fade-up" style={{ animationDelay: '80ms' }}>This page wandered off</h1>
      <p className="mt-3 max-w-md text-ink-500 animate-fade-up" style={{ animationDelay: '140ms' }}>
        The link may be broken or the page may have moved. The catalogue is still right where you left it.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3 animate-fade-up" style={{ animationDelay: '200ms' }}>
        <Button to="/" size="lg">Back to home</Button>
        <Button to="/products" size="lg" variant="outline">Shop products</Button>
      </div>

      <ul className="mt-10 flex flex-wrap items-center justify-center gap-2 animate-fade-up" style={{ animationDelay: '260ms' }}>
        {SUGGESTIONS.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className="rounded-full border border-ink-200 bg-surface px-4 py-2 text-sm font-medium text-ink-600 transition hover:border-brand-300 hover:text-brand-700">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export default NotFoundPage;
