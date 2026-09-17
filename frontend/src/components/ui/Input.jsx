import { forwardRef, useId, useState } from 'react';
import cn from '@/utils/cn';

/** Shared label + control + help/error scaffolding. */
const Field = ({ id, label, error, hint, required, children, className }) => (
  <div className={cn('w-full', className)}>
    {label && (
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-ink-700">
        {label}
        {required && <span className="ml-0.5 text-danger-500">*</span>}
      </label>
    )}
    {children}
    {error ? (
      <p
        id={`${id}-error`}
        role="alert"
        className="mt-1.5 flex items-start gap-1.5 text-[13px] font-medium text-danger-600 animate-fade-down"
      >
        <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 012 0v4a1 1 0 11-2 0V9zm1-4a1 1 0 100 2 1 1 0 000-2z"
            clipRule="evenodd"
          />
        </svg>
        {error}
      </p>
    ) : (
      hint && <p className="mt-1.5 text-[13px] text-ink-500">{hint}</p>
    )}
  </div>
);

const controlClasses = (error, className) =>
  cn(
    'input-base',
    error && 'border-danger-500 hover:border-danger-500 focus:border-danger-500 focus:ring-danger-500/15',
    className
  );

const EyeIcon = ({ open }) => (
  <svg className="h-4.5 w-4.5 h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {open ? (
      <>
        <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M3 3l18 18" />
        <path d="M10.6 5.7A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3 3.9" />
        <path d="M6.6 6.6C4 8.4 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.6 0 3-.4 4.2-1" />
        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      </>
    )}
  </svg>
);

export const Input = forwardRef(
  (
    { label, error, hint, required, className, containerClassName, leadingIcon, trailing, id, type = 'text', ...props },
    ref
  ) => {
    const generatedId = useId();
    const fieldId = id || generatedId;
    const [revealed, setRevealed] = useState(false);
    const isPassword = type === 'password';
    const resolvedType = isPassword && revealed ? 'text' : type;

    return (
      <Field id={fieldId} label={label} error={error} hint={hint} required={required} className={containerClassName}>
        <div className="relative">
          {leadingIcon && (
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">
              {leadingIcon}
            </span>
          )}
          <input
            ref={ref}
            id={fieldId}
            type={resolvedType}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${fieldId}-error` : undefined}
            className={controlClasses(error, cn(leadingIcon && 'pl-10', (isPassword || trailing) && 'pr-11', className))}
            {...props}
          />
          {isPassword ? (
            <button
              type="button"
              onClick={() => setRevealed((value) => !value)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
              aria-label={revealed ? 'Hide password' : 'Show password'}
              aria-pressed={revealed}
              tabIndex={-1}
            >
              <EyeIcon open={revealed} />
            </button>
          ) : (
            trailing && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">{trailing}</span>
          )}
        </div>
      </Field>
    );
  }
);
Input.displayName = 'Input';

export const Textarea = forwardRef(
  ({ label, error, hint, required, className, containerClassName, rows = 4, id, ...props }, ref) => {
    const generatedId = useId();
    const fieldId = id || generatedId;

    return (
      <Field id={fieldId} label={label} error={error} hint={hint} required={required} className={containerClassName}>
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className={controlClasses(error, cn('resize-y leading-relaxed', className))}
          {...props}
        />
      </Field>
    );
  }
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef(
  ({ label, error, hint, required, className, containerClassName, children, id, ...props }, ref) => {
    const generatedId = useId();
    const fieldId = id || generatedId;

    return (
      <Field id={fieldId} label={label} error={error} hint={hint} required={required} className={containerClassName}>
        <div className="relative">
          <select
            ref={ref}
            id={fieldId}
            aria-invalid={Boolean(error)}
            className={controlClasses(error, cn('appearance-none pr-10', className))}
            {...props}
          >
            {children}
          </select>
          <svg
            className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.2 7.2a1 1 0 011.4 0L10 10.6l3.4-3.4a1 1 0 111.4 1.4l-4.1 4.1a1 1 0 01-1.4 0L5.2 8.6a1 1 0 010-1.4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </Field>
    );
  }
);
Select.displayName = 'Select';

export const Checkbox = ({ label, description, className, id, ...props }) => {
  const generatedId = useId();
  const fieldId = id || generatedId;

  return (
    <label
      htmlFor={fieldId}
      className={cn('group flex cursor-pointer items-start gap-3 rounded-lg transition', className)}
    >
      <span className="relative mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center">
        <input
          id={fieldId}
          type="checkbox"
          className="peer h-[18px] w-[18px] cursor-pointer appearance-none rounded-[5px] border border-ink-300 bg-surface transition
                     checked:border-brand-600 checked:bg-brand-600 hover:border-ink-400 checked:hover:bg-brand-700
                     focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          {...props}
        />
        <svg
          className="pointer-events-none absolute h-3 w-3 scale-50 text-white opacity-0 transition duration-150 peer-checked:scale-100 peer-checked:opacity-100"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4.5 10.5l3.5 3.5L15.5 6.5" />
        </svg>
      </span>
      <span className="text-sm">
        <span className="font-medium text-ink-800 transition group-hover:text-ink-900">{label}</span>
        {description && <span className="mt-0.5 block text-[13px] text-ink-500">{description}</span>}
      </span>
    </label>
  );
};

/** iOS-style toggle for boolean settings (admin visibility flags). */
export const Switch = ({ label, description, checked, onChange, id, className, disabled }) => {
  const generatedId = useId();
  const fieldId = id || generatedId;

  return (
    <label htmlFor={fieldId} className={cn('flex cursor-pointer items-start justify-between gap-4', disabled && 'opacity-60', className)}>
      <span className="text-sm">
        <span className="font-medium text-ink-800">{label}</span>
        {description && <span className="mt-0.5 block text-[13px] text-ink-500">{description}</span>}
      </span>
      <span className="relative mt-0.5 shrink-0">
        <input
          id={fieldId}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="peer sr-only"
        />
        <span className="block h-6 w-11 rounded-full bg-ink-300 transition peer-checked:bg-brand-600 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-soft transition-transform duration-200 ease-spring peer-checked:translate-x-5" />
      </span>
    </label>
  );
};

export default Input;
