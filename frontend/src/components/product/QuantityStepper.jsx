import { useEffect, useState } from 'react';
import cn from '@/utils/cn';

/** Accessible −/+ quantity control, clamped to the available stock. */
const QuantityStepper = ({ value, onChange, min = 1, max = 99, disabled = false, size = 'md', className }) => {
  const sizes = {
    sm: { wrap: 'h-9', button: 'w-9 text-base', display: 'w-9 text-sm' },
    md: { wrap: 'h-11', button: 'w-11 text-lg', display: 'w-12 text-[15px]' },
  }[size];

  // Brief pop on the number when it changes.
  const [tick, setTick] = useState(0);
  useEffect(() => setTick((t) => t + 1), [value]);

  const clamp = (next) => Math.max(min, Math.min(max, next));

  const buttonClasses = cn(
    'flex h-full items-center justify-center font-bold text-ink-700 transition-all duration-150',
    'hover:bg-brand-50 hover:text-brand-700 active:scale-90 disabled:cursor-not-allowed disabled:text-ink-300 disabled:hover:bg-transparent',
    sizes.button
  );

  return (
    <div
      className={cn(
        'inline-flex items-center overflow-hidden rounded-xl border border-ink-200 bg-surface shadow-soft',
        sizes.wrap,
        disabled && 'opacity-60',
        className
      )}
    >
      <button type="button" onClick={() => onChange(clamp(value - 1))} disabled={disabled || value <= min} className={buttonClasses} aria-label="Decrease quantity">
        −
      </button>

      <input
        key={tick}
        type="number"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value, 10);
          if (!Number.isNaN(parsed)) onChange(clamp(parsed));
        }}
        aria-label="Quantity"
        className={cn(
          'h-full border-x border-ink-100 bg-ink-50/60 text-center font-bold text-ink-900 focus:bg-surface focus:outline-none animate-pop',
          sizes.display
        )}
      />

      <button type="button" onClick={() => onChange(clamp(value + 1))} disabled={disabled || value >= max} className={buttonClasses} aria-label="Increase quantity">
        +
      </button>
    </div>
  );
};

export default QuantityStepper;
