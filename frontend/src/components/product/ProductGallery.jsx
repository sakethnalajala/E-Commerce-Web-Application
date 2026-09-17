import { useState } from 'react';
import cn from '@/utils/cn';
import ProductImage from '@/components/product/ProductImage';

/**
 * Product image viewer: large stage with a cursor-following zoom on hover
 * (desktop), plus a thumbnail rail. Pure CSS transforms — no extra libraries.
 */
const ProductGallery = ({ images = [], name, badge, category }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [origin, setOrigin] = useState('50% 50%');
  const [zoomed, setZoomed] = useState(false);
  const active = images[activeIndex];

  const handleMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  };

  return (
    <div className="flex flex-col gap-4 lg:sticky lg:top-24">
      <div
        className="group relative aspect-square overflow-hidden rounded-3xl border border-ink-200/80 bg-surface shadow-card"
        onMouseMove={handleMove}
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
      >
        <ProductImage
          key={active?.publicId ?? activeIndex}
          src={active}
          alt={name}
          category={category}
          loading="eager"
          className={cn('transition-transform duration-300 ease-out animate-fade-in', zoomed && 'lg:scale-[1.6]')}
          style={{ transformOrigin: origin }}
        />

        {badge && <div className="absolute left-4 top-4 z-10">{badge}</div>}

        <span className="pointer-events-none absolute bottom-4 right-4 hidden items-center gap-1.5 rounded-full bg-night-400/70 px-3 py-1.5 text-xs font-semibold text-white opacity-0 backdrop-blur transition group-hover:opacity-100 lg:flex">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.2-3.2M11 8v6M8 11h6" /></svg>
          Hover to zoom
        </span>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setActiveIndex((index) => (index - 1 + images.length) % images.length)}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-ink-700 shadow-card opacity-0 transition hover:bg-surface group-hover:opacity-100 lg:opacity-100"
              aria-label="Previous image"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.8 4.3a1 1 0 010 1.4L8.5 10l4.3 4.3a1 1 0 01-1.4 1.4l-5-5a1 1 0 010-1.4l5-5a1 1 0 011.4 0z" clipRule="evenodd" /></svg>
            </button>
            <button
              type="button"
              onClick={() => setActiveIndex((index) => (index + 1) % images.length)}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-ink-700 shadow-card opacity-0 transition hover:bg-surface group-hover:opacity-100 lg:opacity-100"
              aria-label="Next image"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.2 15.7a1 1 0 010-1.4L11.5 10 7.2 5.7a1 1 0 011.4-1.4l5 5a1 1 0 010 1.4l-5 5a1 1 0 01-1.4 0z" clipRule="evenodd" /></svg>
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="scrollbar-none flex gap-3 overflow-x-auto pb-1" role="tablist" aria-label="Product images">
          {images.map((image, index) => (
            <button
              key={image.publicId ?? index}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              aria-label={`View image ${index + 1} of ${images.length}`}
              className={cn(
                'h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 bg-surface transition-all duration-200',
                index === activeIndex
                  ? 'border-brand-600 shadow-glow-sm'
                  : 'border-ink-200 opacity-70 hover:border-ink-300 hover:opacity-100'
              )}
            >
              <ProductImage src={image} alt="" category={category} compact />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
