import { useEffect, useState } from 'react';
import cn from '@/utils/cn';

/**
 * Category-specific placeholder art. Keyed by a keyword found in the category
 * name so new categories still get something sensible.
 */
const CATEGORY_ICONS = [
  { match: /electronic|phone|laptop|audio|tech/i, label: 'Electronics', path: <><rect x="3" y="5" width="18" height="12" rx="2" /><path d="M8 21h8M12 17v4" /></> },
  { match: /fashion|cloth|apparel|wear|shoe/i, label: 'Fashion', path: <><path d="M9 3 5.5 5 3 10l3 1v10h12V11l3-1-2.5-5L15 3a3 3 0 0 1-6 0Z" /></> },
  { match: /home|kitchen|appliance|furniture/i, label: 'Home', path: <><path d="M4 11l8-7 8 7" /><path d="M6 10v10h12V10" /><path d="M10 20v-5h4v5" /></> },
  { match: /sport|fitness|outdoor|gym/i, label: 'Fitness', path: <><path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12" /></> },
  { match: /book|read|novel/i, label: 'Books', path: <><path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4V4Z" /><path d="M20 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8V4Z" /></> },
  { match: /beauty|care|skin|groom|health/i, label: 'Beauty', path: <><path d="M9 3h6v4H9zM8 7h8l1 14H7L8 7Z" /><path d="M10 12h4" /></> },
];

const iconFor = (categoryName = '') =>
  CATEGORY_ICONS.find((entry) => entry.match.test(categoryName)) ?? {
    label: 'Product',
    path: <><path d="M20 7.5 12 3 4 7.5v9L12 21l8-4.5v-9Z" /><path d="M4 7.5 12 12l8-4.5M12 12v9" /></>,
  };

/** Only http(s) URLs are ever put in an <img>; anything else is "no image". */
const isValidImageUrl = (url) => typeof url === 'string' && /^https?:\/\//i.test(url.trim());

/**
 * Honest placeholder for a product without a usable image. It says so,
 * instead of showing an unrelated stock photo.
 */
export const ImagePlaceholder = ({ category, compact = false, className }) => {
  const icon = iconFor(typeof category === 'string' ? category : category?.name);
  return (
    <div
      role="img"
      aria-label={`${icon.label} image unavailable`}
      className={cn(
        'flex h-full w-full flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-ink-100 to-ink-50 text-ink-400',
        className
      )}
    >
      <svg className={compact ? 'h-5 w-5' : 'h-9 w-9'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {icon.path}
      </svg>
      {!compact && (
        <>
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">{icon.label}</span>
          <span className="text-[11px] text-ink-400">Image unavailable</span>
        </>
      )}
    </div>
  );
};

/**
 * Product photo with real fallback behaviour: an invalid URL or a load error
 * renders the category placeholder instead of a broken image. `src` may be an
 * image object ({ url }) or a plain URL string.
 */
const ProductImage = ({ src, alt = '', category, className, imgClassName, compact = false, loading = 'lazy', ...rest }) => {
  const url = typeof src === 'string' ? src : src?.url;
  const valid = isValidImageUrl(url);
  const [failed, setFailed] = useState(false);

  // A new URL gets a fresh chance to load.
  useEffect(() => {
    setFailed(false);
  }, [url]);

  if (!valid || failed) {
    return <ImagePlaceholder category={category} compact={compact} className={className} />;
  }

  return (
    <img
      src={url}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
      className={cn('h-full w-full object-cover', className, imgClassName)}
      {...rest}
    />
  );
};

export default ProductImage;
