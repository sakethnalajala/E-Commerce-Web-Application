import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { productApi, categoryApi } from '@/api';
import { formatCurrency, formatNumber, discountPercent } from '@/utils/format';
import useApiResource from '@/hooks/useApiResource';
import useAuth from '@/hooks/useAuth';
import ProductGrid from '@/components/product/ProductGrid';
import Button from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/States';
import { Rating } from '@/components/ui/Rating';
import { Reveal, Aurora } from '@/components/common/Motion';
import cn from '@/utils/cn';
import ProductImage from '@/components/product/ProductImage';

/* ------------------------------------------------------------------ */
/* Static copy                                                         */
/* ------------------------------------------------------------------ */

const VALUE_PROPS = [
  {
    title: 'Free delivery over ₹999',
    text: 'Flat ₹49 below that — always calculated on the server, never a surprise at the door.',
    icon: <><rect x="1" y="6" width="14" height="11" rx="2" /><path d="M15 9h4l3 3.5V17h-7" /><circle cx="6" cy="19" r="2" /><circle cx="18" cy="19" r="2" /></>,
  },
  {
    title: 'Cash on delivery',
    text: 'Pay when it arrives. No card details, no wallets, nothing stored.',
    icon: <><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></>,
  },
  {
    title: 'Verified reviews',
    text: 'Ratings from people who actually bought the product, flagged on every review.',
    icon: <><path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8L6.8 19.2l1-5.9L3.5 9.2l5.9-.8L12 3z" /></>,
  },
  {
    title: 'Live order tracking',
    text: 'Confirmed, shipped, delivered — with the option to cancel until it ships.',
    icon: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>,
  },
];

const CATEGORY_GRADIENTS = [
  'from-brand-600 to-fuchsia-600',
  'from-sky-500 to-brand-600',
  'from-accent-500 to-rose-500',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-brand-600',
  'from-night-100 to-brand-800',
];

const Icon = ({ path, className = 'h-5 w-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {path}
  </svg>
);

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

const FloatingProduct = ({ product, className, delay = 0 }) => {
  if (!product) return null;
  const price = product.effectivePrice ?? product.price;
  const discount = discountPercent(product.price, product.discountPrice);

  // Rotation lives on the outer wrapper so the entrance animation's transform
  // on the link never overrides it.
  return (
    <div className={cn('group absolute w-52 transition-transform duration-500 hover:rotate-0 hover:scale-105', className)}>
      <Link
        to={`/products/${product.slug ?? product._id}`}
        className="block overflow-hidden rounded-3xl border border-white/15 bg-white/[0.07] p-3 shadow-lift backdrop-blur-xl animate-fade-up"
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-night-100">
          <ProductImage src={product.images?.[0]} alt="" category={product.category} loading="eager" className="transition duration-700 group-hover:scale-110" />
          {discount > 0 && (
            <span className="absolute left-2 top-2 rounded-full bg-accent-400 px-2 py-0.5 text-[10px] font-extrabold text-night-400">−{discount}%</span>
          )}
        </div>
        <div className="px-1 pt-3">
          <p className="truncate text-[13px] font-semibold text-white">{product.name}</p>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-sm font-bold text-accent-300">{formatCurrency(price)}</span>
            <Rating value={product.ratingsAverage} size="xs" />
          </div>
        </div>
      </Link>
    </div>
  );
};

const HeroStat = ({ value, label, delay }) => (
  <div className="animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
    <p className="font-display text-2xl font-extrabold text-white sm:text-3xl">{value}</p>
    <p className="mt-0.5 text-xs font-medium uppercase tracking-[0.14em] text-white/45">{label}</p>
  </div>
);

const Hero = ({ featured, stats }) => (
  <section className="relative overflow-hidden bg-night-400 noise">
    <Aurora />
    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-canvas to-transparent" aria-hidden="true" />

    <div className="container-page relative">
      <div className="grid min-h-[620px] items-center gap-12 py-16 lg:grid-cols-12 lg:py-24">
        <div className="lg:col-span-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80 backdrop-blur animate-fade-up">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-pulse-soft" />
            New arrivals every week
          </span>

          <h1
            className="mt-6 font-display text-[44px] font-extrabold leading-[1.02] tracking-[-0.035em] text-white sm:text-6xl lg:text-7xl animate-fade-up text-balance"
            style={{ animationDelay: '80ms' }}
          >
            Everything you need,
            <br />
            <span className="gradient-text">priced honestly.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/65 animate-fade-up" style={{ animationDelay: '160ms' }}>
            Electronics, fashion, home essentials, fitness gear, books and beauty — curated, reviewed
            by real buyers, and delivered fast with cash on delivery.
          </p>

          <div className="mt-9 flex flex-wrap gap-3 animate-fade-up" style={{ animationDelay: '240ms' }}>
            <Button to="/products" size="xl" variant="onBrand">
              Shop the catalogue
              <Icon className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" path={<path d="M5 12h14M13 6l6 6-6 6" />} />
            </Button>
            <Button to="/products?sort=popular" size="xl" variant="onBrandOutline">
              Best sellers
            </Button>
          </div>

          <div className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-white/10 pt-8">
            <HeroStat value={stats.products ? `${formatNumber(stats.products)}+` : '—'} label="Products" delay={320} />
            <HeroStat value={stats.categories || '—'} label="Categories" delay={380} />
            <HeroStat value={stats.rating ? `${stats.rating}★` : '—'} label="Avg rating" delay={440} />
          </div>
        </div>

        {/* Floating product stack */}
        <div className="relative hidden h-[520px] lg:col-span-5 lg:block" aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/30 blur-3xl" />
          <div className="absolute inset-0 animate-float">
            <FloatingProduct product={featured[0]} className="left-2 top-6 -rotate-6" delay={300} />
          </div>
          <div className="absolute inset-0 animate-float [animation-delay:1.4s]">
            <FloatingProduct product={featured[1]} className="right-0 top-24 rotate-6" delay={420} />
          </div>
          <div className="absolute inset-0 animate-float [animation-delay:2.6s]">
            <FloatingProduct product={featured[2]} className="left-16 top-64 -rotate-2" delay={540} />
          </div>

          <div className="glass absolute right-6 top-2 flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-white animate-fade-up [animation-delay:700ms]">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-success-500/20 text-success-500">
              <Icon className="h-4 w-4" path={<><rect x="1" y="6" width="14" height="11" rx="2" /><path d="M15 9h4l3 3.5V17h-7" /><circle cx="6" cy="19" r="2" /><circle cx="18" cy="19" r="2" /></>} />
            </span>
            Free delivery over ₹999
          </div>
          <div className="glass absolute bottom-6 right-2 flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-white animate-fade-up [animation-delay:820ms]">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-400/20 text-accent-300">
              <Icon className="h-4 w-4" path={<><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></>} />
            </span>
            Cash on delivery
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

const BrandMarquee = ({ brands }) => {
  if (!brands.length) return null;
  const items = [...brands, ...brands];

  return (
    <div className="border-b border-ink-200/70 bg-surface py-5">
      <div className="container-page flex items-center gap-6">
        <p className="hidden shrink-0 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-400 md:block">
          Brands we carry
        </p>
        <div className="mask-fade-x relative flex-1 overflow-hidden">
          <div className="flex w-max animate-marquee gap-10 hover:[animation-play-state:paused]">
            {items.map((brand, index) => (
              <Link
                key={`${brand}-${index}`}
                to={`/products?brand=${encodeURIComponent(brand)}`}
                className="whitespace-nowrap font-display text-lg font-bold text-ink-400 transition hover:text-brand-600"
              >
                {brand}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionHeading = ({ eyebrow, title, description, to, cta }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="mt-2 text-balance">{title}</h2>
      {description && <p className="mt-2 max-w-xl text-ink-500">{description}</p>}
    </div>
    {to && (
      <Link to={to} className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-600 transition hover:text-brand-700">
        {cta}
        <Icon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" path={<path d="M5 12h14M13 6l6 6-6 6" />} />
      </Link>
    )}
  </div>
);

const CategoryTile = ({ category, cover, index, large }) => (
  <Link
    to={`/products?category=${category.slug}`}
    className={cn(
      'group relative overflow-hidden rounded-3xl bg-night-200 text-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift',
      large ? 'min-h-[300px] sm:row-span-2' : 'min-h-[150px]'
    )}
  >
    {cover ? (
      <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
    ) : (
      <div className={cn('absolute inset-0 bg-gradient-to-br', CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length])} />
    )}
    <div className="absolute inset-0 bg-gradient-to-t from-night-400/90 via-night-400/30 to-transparent" />

    <div className="relative flex h-full flex-col justify-end p-5">
      <p className={cn('font-display font-bold leading-tight', large ? 'text-2xl' : 'text-lg')}>{category.name}</p>
      <p className="mt-1 text-xs font-medium text-white/60">{category.productCount ?? 0} products</p>
      <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur transition group-hover:bg-surface group-hover:text-night-400">
        Explore
        <Icon className="h-3.5 w-3.5" path={<path d="M5 12h14M13 6l6 6-6 6" />} />
      </span>
    </div>
  </Link>
);

const DealBanner = ({ product }) => {
  if (!product) return null;
  const discount = discountPercent(product.price, product.discountPrice);
  const price = product.effectivePrice ?? product.price;

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-night-400 text-white noise">
      <Aurora intensity={0.8} />
      <div className="relative grid gap-8 p-8 sm:p-10 lg:grid-cols-2 lg:items-center lg:p-14">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-400 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wide text-night-400 shadow-glow-gold">
            <Icon className="h-3.5 w-3.5" path={<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />} />
            Deal of the week
          </span>
          <h2 className="mt-5 font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl text-balance">{product.name}</h2>
          <p className="mt-3 line-clamp-2 text-white/65">{product.description}</p>

          <div className="mt-6 flex flex-wrap items-end gap-x-4 gap-y-2">
            <span className="font-display text-4xl font-extrabold text-white">{formatCurrency(price)}</span>
            {discount > 0 && (
              <>
                <span className="pb-1.5 text-lg text-white/40 line-through">{formatCurrency(product.price)}</span>
                <span className="mb-1.5 rounded-full bg-success-500/20 px-2.5 py-1 text-xs font-bold text-success-500">Save {discount}%</span>
              </>
            )}
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Button to={`/products/${product.slug ?? product._id}`} size="lg" variant="onBrand">
              Grab the deal
            </Button>
            <span className="flex items-center gap-2 text-sm text-white/60">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-pulse-soft" />
              {product.stock} left in stock
            </span>
          </div>
        </div>

        <Link to={`/products/${product.slug ?? product._id}`} className="group relative mx-auto w-full max-w-sm">
          <div className="absolute inset-4 rounded-full bg-accent-400/30 blur-3xl transition group-hover:bg-accent-400/40" />
          <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-white/15 shadow-lift animate-float">
            <ProductImage src={product.images?.[0]} alt={product.name} category={product.category} className="transition duration-700 group-hover:scale-105" />
          </div>
        </Link>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  const featured = useApiResource(() => productApi.featured(8), []);
  const newest = useApiResource(() => productApi.list({ sort: 'newest', limit: 4 }), []);
  const categories = useApiResource(() => categoryApi.list(), []);
  const filters = useApiResource(() => productApi.filters(), []);
  // One broader fetch feeds the category covers and the deal banner.
  const popular = useApiResource(() => productApi.list({ sort: 'popular', limit: 40 }), []);

  const featuredList = featured.data?.products ?? [];
  const categoryList = categories.data?.categories ?? [];
  const popularList = popular.data?.products ?? [];

  const covers = useMemo(() => {
    const map = new Map();
    [...featuredList, ...popularList].forEach((product) => {
      const key = product.category?._id ?? product.category;
      if (key && !map.has(key) && product.images?.[0]?.url) map.set(key, product.images[0].url);
    });
    return map;
  }, [featuredList, popularList]);

  const deal = useMemo(() => {
    const candidates = [...popularList, ...featuredList].filter((product) => product.stock > 0 && product.discountPrice);
    return candidates.sort(
      (a, b) => discountPercent(b.price, b.discountPrice) - discountPercent(a.price, a.discountPrice)
    )[0];
  }, [popularList, featuredList]);

  const stats = useMemo(() => {
    const rated = popularList.filter((product) => product.ratingsCount > 0);
    const rating = rated.length
      ? (rated.reduce((sum, product) => sum + product.ratingsAverage, 0) / rated.length).toFixed(1)
      : null;
    return {
      products: popular.meta?.total ?? newest.meta?.total ?? 0,
      categories: categoryList.length,
      rating,
    };
  }, [popularList, popular.meta, newest.meta, categoryList.length]);

  return (
    <div>
      <Hero featured={featuredList} stats={stats} />

      <BrandMarquee brands={filters.data?.brands ?? []} />

      {/* Categories */}
      <section className="bg-glow-canvas">
      <div className="container-page py-16 sm:py-20">
        <Reveal>
          <SectionHeading
            eyebrow="Browse"
            title="Shop by category"
            description="Six curated departments, each with products chosen for value and quality."
            to="/products"
            cta="View all products"
          />
        </Reveal>

        {categories.error && !categories.loading ? (
          <ErrorState className="mt-8" title="Could not load categories" error={categories.error} onRetry={categories.reload} />
        ) : (
        <div className="mt-8 grid auto-rows-fr grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.loading
            ? Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className={cn('skeleton rounded-3xl', index === 0 ? 'min-h-[300px] sm:row-span-2' : 'min-h-[150px]')} />
              ))
            : categoryList.map((category, index) => (
                <Reveal key={category._id} delay={index * 60} className={index === 0 ? 'col-span-2 sm:col-span-1 sm:row-span-2' : ''}>
                  <CategoryTile category={category} cover={covers.get(category._id)} index={index} large={index === 0} />
                </Reveal>
              ))}
        </div>
        )}
      </div>
      </section>

      {/* Best sellers */}
      <section className="bg-surface bg-glow-white py-16 sm:py-20">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Most loved"
              title="Best sellers"
              description="The products customers keep coming back for, ranked by units sold."
              to="/products?sort=popular"
              cta="See all best sellers"
            />
          </Reveal>
          <div className="mt-8">
            <ProductGrid
              products={popularList.slice(0, 4)}
              loading={popular.loading}
              error={popular.error}
              onRetry={popular.reload}
              skeletonCount={4}
              emptyTitle="No sales yet"
              emptyDescription="Best sellers appear once orders start coming in."
            />
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="relative overflow-hidden bg-gradient-to-b from-canvas via-brand-50/40 to-canvas py-16 sm:py-20">
        <div className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-brand-300/25 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-32 bottom-10 h-72 w-72 rounded-full bg-accent-300/20 blur-3xl" aria-hidden="true" />
        <div className="container-page relative">
          <Reveal>
            <SectionHeading
              eyebrow="Hand-picked"
              title="Featured this week"
              description="The products our team is most excited about right now."
              to="/products"
              cta="See everything"
            />
          </Reveal>

          <div className="mt-8">
            <ProductGrid
              products={featuredList}
              loading={featured.loading}
              error={featured.error}
              onRetry={featured.reload}
              emptyTitle="No featured products yet"
              emptyDescription="Check back soon, or browse the full catalogue."
              emptyAction={<Button to="/products">Browse catalogue</Button>}
            />
          </div>
        </div>
      </section>

      {/* Deal */}
      {deal && (
        <section className="container-page py-16 sm:py-20">
          <Reveal>
            <DealBanner product={deal} />
          </Reveal>
        </section>
      )}

      {/* Value props */}
      <section className="bg-surface bg-glow-white py-16 sm:py-20">
        <div className="container-page">
          <Reveal>
            <SectionHeading eyebrow="Why ShopSphere" title="Shopping without the small print" />
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUE_PROPS.map((item, index) => (
              <Reveal key={item.title} delay={index * 80}>
                <div className="group h-full rounded-3xl border border-ink-200/80 bg-canvas p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:bg-surface hover:shadow-lift">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow-sm transition-transform duration-300 group-hover:scale-110">
                    <Icon path={item.icon} />
                  </span>
                  <h3 className="mt-5 text-base font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Newest */}
      <section className="bg-glow-canvas">
      <div className="container-page py-16 sm:py-20">
        <Reveal>
          <SectionHeading
            eyebrow="Fresh"
            title="Just landed"
            description="The newest additions to the catalogue."
            to="/products?sort=newest"
            cta="View all new arrivals"
          />
        </Reveal>
        <div className="mt-8">
          <ProductGrid products={newest.data?.products} loading={newest.loading} error={newest.error} onRetry={newest.reload} skeletonCount={4} />
        </div>
      </div>
      </section>

      {/* CTA band */}
      <section className="container-page pb-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-brand-gradient p-8 text-white shadow-glow sm:p-12">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/15 blur-3xl" aria-hidden="true" />
            <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-white text-balance">
                  {isAuthenticated ? 'Your orders, all in one place.' : 'Create an account in under a minute.'}
                </h2>
                <p className="mt-2 max-w-lg text-white/75">
                  {isAuthenticated
                    ? 'Track deliveries, manage saved addresses and review what you bought.'
                    : 'Save addresses, track every delivery and keep your cart across devices.'}
                </p>
              </div>
              <Button to={isAuthenticated ? '/orders' : '/register'} size="lg" variant="onBrand" className="shrink-0">
                {isAuthenticated ? 'View my orders' : 'Get started — it’s free'}
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
};

export default HomePage;
