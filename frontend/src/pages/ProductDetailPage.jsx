import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { productApi } from '@/api';
import { formatCurrency, discountPercent, formatNumber } from '@/utils/format';
import useApiResource from '@/hooks/useApiResource';
import useCart from '@/hooks/useCart';
import ProductGallery from '@/components/product/ProductGallery';
import QuantityStepper from '@/components/product/QuantityStepper';
import ReviewSection from '@/components/product/ReviewSection';
import ProductGrid from '@/components/product/ProductGrid';
import PageHeader from '@/components/common/PageHeader';
import { Reveal } from '@/components/common/Motion';
import Button from '@/components/ui/Button';
import Badge, { StockBadge } from '@/components/ui/Badge';
import { Rating } from '@/components/ui/Rating';
import { LoadingBlock } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/States';
import cn from '@/utils/cn';

const ASSURANCES = [
  { label: 'Free delivery over ₹999', sub: 'Flat ₹49 below that', icon: <><rect x="1" y="6" width="14" height="11" rx="2" /><path d="M15 9h4l3 3.5V17h-7" /><circle cx="6" cy="19" r="2" /><circle cx="18" cy="19" r="2" /></> },
  { label: 'Cash on delivery', sub: 'Pay when it arrives', icon: <><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></> },
  { label: 'Cancel before dispatch', sub: 'From your orders page', icon: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></> },
];

const ProductDetailPage = () => {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const { addItem, mutating } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const resource = useApiResource(() => productApi.detail(identifier), [identifier]);

  if (resource.loading) return <LoadingBlock label="Loading product…" className="min-h-[60vh]" />;

  if (resource.error) {
    return (
      <div className="container-page py-12">
        <ErrorState
          title={resource.error.status === 404 ? 'Product not found' : 'Could not load this product'}
          error={resource.error.status === 404 ? 'This product may have been removed from the catalogue.' : resource.error}
          onRetry={resource.error.status === 404 ? undefined : resource.reload}
        />
        <div className="mt-6 text-center">
          <Button to="/products" variant="outline">Back to all products</Button>
        </div>
      </div>
    );
  }

  const { product, reviews = [], related = [], viewer } = resource.data ?? {};
  if (!product) return null;

  const price = product.effectivePrice ?? product.discountPrice ?? product.price;
  const discount = discountPercent(product.price, product.discountPrice);
  const outOfStock = product.stock <= 0;

  const handleAddToCart = async () => {
    const ok = await addItem(product, quantity);
    if (ok) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1600);
    }
  };

  const handleBuyNow = async () => {
    const ok = await addItem(product, quantity);
    if (ok) navigate('/cart');
  };

  return (
    <div className="container-page py-6 sm:py-8">
      <PageHeader
        back="/products"
        backLabel="Back to products"
        className="mb-6"
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Products', to: '/products' },
          ...(product.category ? [{ label: product.category.name, to: `/products?category=${product.category.slug}` }] : []),
          { label: product.name },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-6 xl:col-span-7">
          <ProductGallery
            images={product.images}
            name={product.name}
            category={product.category}
            badge={
              discount > 0 && (
                <span className="rounded-full bg-accent-400 px-3.5 py-1.5 text-sm font-extrabold text-night-400 shadow-glow-gold">
                  −{discount}% today
                </span>
              )
            }
          />
        </div>

        <div className="lg:col-span-6 xl:col-span-5">
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <Link to={`/products?brand=${encodeURIComponent(product.brand)}`} className="font-bold uppercase tracking-[0.14em] text-brand-600 hover:text-brand-700">
              {product.brand}
            </Link>
            {product.category && (
              <>
                <span className="text-ink-300">·</span>
                <Link to={`/products?category=${product.category.slug}`} className="font-medium text-ink-500 hover:text-brand-600">
                  {product.category.name}
                </Link>
              </>
            )}
          </div>

          <h1 className="mt-3 text-balance">{product.name}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Rating value={product.ratingsAverage} size="sm" showValue count={product.ratingsCount} />
            <a href="#reviews" className="text-sm font-semibold text-brand-600 underline-offset-4 hover:underline">
              Read reviews
            </a>
          </div>

          {/* Price block */}
          <div className="mt-6 rounded-3xl border border-ink-200/80 bg-surface p-5 shadow-card">
            <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
              <span className="font-display text-4xl font-extrabold tracking-tight text-ink-900">{formatCurrency(price)}</span>
              {discount > 0 && (
                <>
                  <span className="pb-1 text-lg text-ink-400 line-through">{formatCurrency(product.price)}</span>
                  <Badge tone="success" className="mb-1">Save {formatCurrency(product.price - price)}</Badge>
                </>
              )}
            </div>
            <p className="mt-1 text-xs text-ink-400">Inclusive of all taxes</p>

            <div className="mt-4 flex items-center justify-between gap-3">
              <StockBadge stock={product.stock} size="md" />
              {!outOfStock && <span className="text-sm text-ink-500">{product.stock} available</span>}
            </div>

            <div className="mt-5 border-t border-ink-100 pt-5">
              {outOfStock ? (
                <div className="rounded-2xl bg-danger-50 p-4">
                  <p className="text-sm font-bold text-danger-700">Currently sold out</p>
                  <p className="mt-1 text-sm text-danger-600">This product is unavailable right now. Browse similar items below.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-sm font-semibold text-ink-700">Quantity</span>
                    <QuantityStepper value={quantity} onChange={setQuantity} max={Math.min(product.stock, 100)} />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      size="lg"
                      onClick={handleAddToCart}
                      loading={mutating}
                      className={cn('flex-1', added && 'bg-success-600 hover:bg-success-600 shadow-none')}
                    >
                      {added ? (
                        <>
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                          Added to cart
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16l-1.2 9.6a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.7L4 6Z" /><circle cx="9" cy="20" r="1.2" /><circle cx="17" cy="20" r="1.2" /></svg>
                          Add to cart
                        </>
                      )}
                    </Button>
                    <Button size="lg" variant="secondary" onClick={handleBuyNow} className="flex-1">
                      Buy now
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-3">
            {ASSURANCES.map((item) => (
              <li key={item.label} className="flex items-start gap-3 rounded-2xl border border-ink-200/80 bg-surface p-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{item.icon}</svg>
                </span>
                <span>
                  <span className="block text-[13px] font-bold text-ink-900">{item.label}</span>
                  <span className="block text-xs text-ink-500">{item.sub}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Description + specs */}
      <Reveal className="mt-12 grid gap-6 lg:grid-cols-3">
        <section className="card p-6 sm:p-8 lg:col-span-2">
          <p className="eyebrow">About this product</p>
          <h2 className="mt-2">Description</h2>
          <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-ink-600">{product.description}</p>
        </section>

        <section className="card p-6 sm:p-8">
          <p className="eyebrow">At a glance</p>
          <dl className="mt-4 divide-y divide-ink-100">
            {[
              { label: 'Brand', value: product.brand },
              { label: 'Category', value: product.category?.name ?? '—' },
              { label: 'Availability', value: product.stock > 0 ? `${product.stock} in stock` : 'Out of stock' },
              { label: 'Units sold', value: formatNumber(product.sold ?? 0) },
              { label: 'Rating', value: `${Number(product.ratingsAverage ?? 0).toFixed(1)} / 5` },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4 py-3">
                <dt className="text-sm text-ink-500">{item.label}</dt>
                <dd className="text-sm font-semibold text-ink-900">{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </Reveal>

      <Reveal className="mt-8">
        <ReviewSection product={product} reviews={reviews} viewer={viewer} onReviewsChanged={resource.reload} />
      </Reveal>

      {related.length > 0 && (
        <Reveal as="section" className="mt-14">
          <p className="eyebrow">Keep browsing</p>
          <h2 className="mt-2">You might also like</h2>
          <ProductGrid className="mt-6" products={related} />
        </Reveal>
      )}
    </div>
  );
};

export default ProductDetailPage;
