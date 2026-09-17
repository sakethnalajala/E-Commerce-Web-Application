import { useState } from 'react';
import cn from '@/utils/cn';

const SIZES = { xs: 'h-3 w-3', sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-8 w-8' };
const STAR = 'M10 1.8l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L2.2 7.5l5.4-.8L10 1.8z';

const Star = ({ fill = 0, className }) => (
  <span className={cn('relative inline-block', className)}>
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-full w-full text-ink-200" aria-hidden="true">
      <path d={STAR} />
    </svg>
    <span className="absolute inset-0 overflow-hidden" style={{ width: `${Math.max(0, Math.min(1, fill)) * 100}%` }}>
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-full w-full text-accent-400" aria-hidden="true">
        <path d={STAR} />
      </svg>
    </span>
  </span>
);

/** Read-only star display with optional review count. */
export const Rating = ({ value = 0, count, size = 'sm', showValue = false, className }) => (
  <div className={cn('flex items-center gap-1.5', className)}>
    <div className="flex items-center gap-0.5" aria-label={`Rated ${value} out of 5`}>
      {[0, 1, 2, 3, 4].map((index) => (
        <Star key={index} fill={value - index} className={SIZES[size]} />
      ))}
    </div>
    {showValue && <span className="text-sm font-bold text-ink-900">{Number(value).toFixed(1)}</span>}
    {count !== undefined && (
      <span className="text-[13px] text-ink-500">
        ({count} {count === 1 ? 'review' : 'reviews'})
      </span>
    )}
  </div>
);

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

/** Interactive star picker with hover preview for the review form. */
export const RatingInput = ({ value = 0, onChange, size = 'lg', error, label = 'Your rating' }) => {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-semibold text-ink-700">{label}</span>
      <div className="flex items-center gap-1" role="radiogroup" aria-label={label} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            className="rounded-md transition-transform duration-150 hover:scale-110 active:scale-95 focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <Star fill={star <= shown ? 1 : 0} className={SIZES[size]} />
          </button>
        ))}
        {shown > 0 && (
          <span className="ml-3 text-sm font-semibold text-ink-700 animate-fade-in" key={shown}>
            {LABELS[shown]}
          </span>
        )}
      </div>
      {error && <p className="mt-1.5 text-[13px] font-medium text-danger-600">{error}</p>}
    </div>
  );
};

export default Rating;
