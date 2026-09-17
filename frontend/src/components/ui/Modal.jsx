import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import cn from '@/utils/cn';
import Button from './Button';

const SIZES = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' };

/**
 * Accessible dialog: closes on Escape and backdrop click, locks body scroll and
 * moves focus into the panel. A bottom sheet on phones, a centred card from
 * `sm` up — each with its own entrance.
 */
const Modal = ({ open, onClose, title, description, children, footer, size = 'md', className }) => {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-night-400/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden bg-surface shadow-popover',
          'rounded-t-3xl animate-slide-up-sheet sm:rounded-3xl sm:animate-scale-in',
          SIZES[size],
          className
        )}
      >
        {/* Drag handle affordance on phones */}
        <div className="flex justify-center pt-3 sm:hidden" aria-hidden="true">
          <span className="h-1.5 w-10 rounded-full bg-ink-200" />
        </div>

        {(title || description) && (
          <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-4 sm:pt-6">
            <div className="min-w-0">
              {title && <h2 className="text-lg font-bold text-ink-900">{title}</h2>}
              {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mr-2 -mt-1 rounded-xl p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
              aria-label="Close dialog"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M6.3 5l3.7 3.7L13.7 5 15 6.3 11.3 10 15 13.7 13.7 15 10 11.3 6.3 15 5 13.7 8.7 10 5 6.3z" />
              </svg>
            </button>
          </div>
        )}

        <div className={cn('scrollbar-thin flex-1 overflow-y-auto px-6 pb-6', !(title || description) && 'pt-6')}>
          {children}
        </div>

        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-ink-100 bg-ink-50/70 px-6 py-4 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

/** Destructive-action confirmation built on Modal. */
export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
}) => (
  <Modal
    open={open}
    onClose={loading ? undefined : onClose}
    size="sm"
    footer={
      <>
        <Button variant="outline" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={tone} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </>
    }
  >
    <div className="flex items-start gap-4">
      <span
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
          tone === 'danger' ? 'bg-danger-50 text-danger-600' : 'bg-brand-50 text-brand-600'
        )}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.3 3.8 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.8a2 2 0 0 0-3.4 0Z" />
        </svg>
      </span>
      <div className="min-w-0">
        <h2 className="text-lg font-bold text-ink-900">{title}</h2>
        {description && <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{description}</p>}
      </div>
    </div>
  </Modal>
);

export default Modal;
