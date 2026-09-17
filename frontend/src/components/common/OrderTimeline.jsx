import cn from '@/utils/cn';
import { ORDER_STATUS } from '@/constants';
import { formatDateTime } from '@/utils/format';

const FLOW = [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED];

const STEP_META = {
  [ORDER_STATUS.PENDING]: {
    text: 'Order received, awaiting confirmation',
    icon: <><circle cx="12" cy="12" r="8.5" /><path d="M12 8v4.5l2.8 1.7" /></>,
  },
  [ORDER_STATUS.CONFIRMED]: {
    text: 'Confirmed and being prepared',
    icon: <><circle cx="12" cy="12" r="8.5" /><path d="M8.5 12.2l2.4 2.4 4.6-4.8" /></>,
  },
  [ORDER_STATUS.SHIPPED]: {
    text: 'With the courier, on its way',
    icon: <><rect x="2.5" y="7" width="12" height="9" rx="1.5" /><path d="M14.5 10h3.4l3.1 3.2V16h-6.5" /><circle cx="7" cy="17.5" r="1.6" /><circle cx="17" cy="17.5" r="1.6" /></>,
  },
  [ORDER_STATUS.DELIVERED]: {
    text: 'Delivered to your address',
    icon: <><path d="M20 7.5 12 3 4 7.5v9L12 21l8-4.5v-9Z" /><path d="M9 12.2l2 2 4-4.2" /></>,
  },
};

/**
 * Order progress: a horizontal stepper from `md` up, vertical on phones.
 * Driven by the order's status history; Cancelled renders its own state.
 */
const OrderTimeline = ({ order }) => {
  const cancelled = order.status === ORDER_STATUS.CANCELLED;
  const currentIndex = FLOW.indexOf(order.status);

  const timestampFor = (status) =>
    order.statusHistory?.find((entry) => entry.status === status)?.changedAt ??
    {
      [ORDER_STATUS.PENDING]: order.createdAt,
      [ORDER_STATUS.CONFIRMED]: order.confirmedAt,
      [ORDER_STATUS.SHIPPED]: order.shippedAt,
      [ORDER_STATUS.DELIVERED]: order.deliveredAt,
    }[status];

  if (cancelled) {
    return (
      <div className="rounded-2xl border border-danger-500/20 bg-danger-50 p-5 animate-fade-in">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-danger-100 text-danger-600">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 7l10 10M17 7L7 17" /></svg>
          </span>
          <div>
            <p className="font-bold text-danger-700">Order cancelled</p>
            <p className="mt-0.5 text-sm text-danger-600">
              {formatDateTime(order.cancelledAt)}
              {order.cancellationReason && ` · ${order.cancellationReason}`}
            </p>
            <p className="mt-2 text-xs text-danger-600/80">Any reserved stock was returned to the catalogue.</p>
          </div>
        </div>
      </div>
    );
  }

  const progress = currentIndex <= 0 ? 0 : (currentIndex / (FLOW.length - 1)) * 100;

  return (
    <div>
      {/* Horizontal (md+) */}
      <ol className="relative hidden md:grid md:grid-cols-4 md:gap-4">
        <div className="absolute left-[12.5%] right-[12.5%] top-6 h-1 rounded-full bg-ink-200" aria-hidden="true">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-[width] duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {FLOW.map((status, index) => {
          const reached = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const timestamp = timestampFor(status);
          const meta = STEP_META[status];

          return (
            <li key={status} className="relative flex flex-col items-center text-center">
              <span
                className={cn(
                  'relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border-2 transition-all duration-500',
                  reached ? 'border-brand-600 bg-brand-600 text-white shadow-glow-sm' : 'border-ink-200 bg-surface text-ink-300',
                  isCurrent && 'ring-4 ring-brand-500/20 scale-110'
                )}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {meta.icon}
                </svg>
                {isCurrent && status !== ORDER_STATUS.DELIVERED && (
                  <span className="absolute inset-0 -z-10 animate-ping rounded-2xl bg-brand-500/30 [animation-duration:2.2s]" aria-hidden="true" />
                )}
              </span>
              <p className={cn('mt-3 text-sm font-bold', reached ? 'text-ink-900' : 'text-ink-400')}>{status}</p>
              <p className={cn('mt-0.5 text-xs leading-snug', reached ? 'text-ink-500' : 'text-ink-300')}>{meta.text}</p>
              {reached && timestamp && <p className="mt-1.5 text-[11px] font-medium text-brand-600">{formatDateTime(timestamp)}</p>}
            </li>
          );
        })}
      </ol>

      {/* Vertical (mobile) */}
      <ol className="space-y-5 md:hidden">
        {FLOW.map((status, index) => {
          const reached = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const timestamp = timestampFor(status);
          const meta = STEP_META[status];

          return (
            <li key={status} className="relative flex gap-4">
              {index < FLOW.length - 1 && (
                <span
                  className={cn('absolute left-[19px] top-10 h-[calc(100%-0.5rem)] w-0.5 rounded-full', index < currentIndex ? 'bg-brand-600' : 'bg-ink-200')}
                  aria-hidden="true"
                />
              )}
              <span
                className={cn(
                  'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2',
                  reached ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-200 bg-surface text-ink-300',
                  isCurrent && 'ring-4 ring-brand-500/20'
                )}
              >
                <svg className="h-4.5 w-4.5 h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {meta.icon}
                </svg>
              </span>
              <div className="min-w-0 pb-1">
                <p className={cn('text-sm font-bold', reached ? 'text-ink-900' : 'text-ink-400')}>
                  {status}
                  {isCurrent && <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">Current</span>}
                </p>
                <p className={cn('mt-0.5 text-sm', reached ? 'text-ink-500' : 'text-ink-300')}>{meta.text}</p>
                {reached && timestamp && <p className="mt-1 text-xs font-medium text-brand-600">{formatDateTime(timestamp)}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default OrderTimeline;
