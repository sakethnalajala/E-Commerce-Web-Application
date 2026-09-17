import Button from '@/components/ui/Button';

/**
 * Honest placeholder for a portal the backend does not support yet. It never
 * shows fake data — it says what the feature will do and what exists today.
 */
const ComingSoon = ({ title, description, requires, alternatives = [] }) => (
  <div className="relative overflow-hidden rounded-3xl border border-ink-200/80 bg-surface p-8 shadow-card sm:p-12">
    <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl" aria-hidden="true" />
    <div className="relative max-w-2xl">
      <span className="inline-flex items-center gap-2 rounded-full bg-accent-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-accent-700">
        <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
        Coming soon
      </span>
      <h2 className="mt-4">{title}</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-600">{description}</p>

      {requires && (
        <div className="mt-6 rounded-2xl border border-ink-200 bg-ink-50 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500">What it needs</p>
          <p className="mt-1.5 text-sm text-ink-700">{requires}</p>
        </div>
      )}

      {alternatives.length > 0 && (
        <div className="mt-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500">Available today</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {alternatives.map((item) => (
              <Button key={item.to} to={item.to} variant="outline" size="sm">
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

export default ComingSoon;
