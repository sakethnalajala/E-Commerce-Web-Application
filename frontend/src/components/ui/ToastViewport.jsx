import cn from '@/utils/cn';

const TONES = {
  success: {
    bar: 'bg-success-500',
    icon: 'bg-success-50 text-success-600',
    path: <path d="M7.5 12.5l3 3 6-6.5" />,
  },
  error: {
    bar: 'bg-danger-500',
    icon: 'bg-danger-50 text-danger-600',
    path: <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" />,
  },
  warning: {
    bar: 'bg-warning-500',
    icon: 'bg-warning-50 text-warning-600',
    path: <><path d="M12 8v5" /><path d="M12 16.5h.01" /></>,
  },
  info: {
    bar: 'bg-brand-500',
    icon: 'bg-brand-50 text-brand-600',
    path: <><path d="M12 11v5" /><path d="M12 7.5h.01" /></>,
  },
};

const AUTO_DISMISS_MS = 4500;

const Toast = ({ toast, onDismiss }) => {
  const tone = TONES[toast.type] ?? TONES.info;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto relative w-full overflow-hidden rounded-2xl border border-ink-200/80 bg-surface/95 shadow-popover backdrop-blur animate-slide-in-right"
    >
      <div className="flex items-start gap-3 p-3.5 pr-3">
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', tone.icon)}>
          <svg className="h-4.5 w-4.5 h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {tone.path}
          </svg>
        </span>

        <div className="min-w-0 flex-1 pt-0.5">
          {toast.title && <p className="text-sm font-semibold text-ink-900">{toast.title}</p>}
          <p className="break-words text-sm leading-snug text-ink-700">{toast.message}</p>
        </div>

        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="-m-1 rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
          aria-label="Dismiss notification"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M6.3 5l3.7 3.7L13.7 5 15 6.3 11.3 10 15 13.7 13.7 15 10 11.3 6.3 15 5 13.7 8.7 10 5 6.3z" />
          </svg>
        </button>
      </div>

      {/* Time-remaining bar: pure transform, runs for the auto-dismiss window. */}
      <span
        className={cn('absolute bottom-0 left-0 h-0.5 w-full origin-left animate-toast-progress', tone.bar)}
        style={{ animationDuration: `${AUTO_DISMISS_MS}ms` }}
        aria-hidden="true"
      />
    </div>
  );
};

/** Fixed stack, top-right on desktop and full-width on phones. */
const ToastViewport = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-end gap-2 p-4 sm:p-6">
      <div className="flex w-full max-w-sm flex-col gap-2.5">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </div>
    </div>
  );
};

export default ToastViewport;
