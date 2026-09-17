import { useState } from 'react';
import { Link } from 'react-router-dom';
import cn from '@/utils/cn';
import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/ui/Button';

/**
 * Help & support. Everything here reflects how the store actually behaves —
 * the delivery, cancellation and payment rules are the ones the API enforces.
 * There is no ticketing backend, so contact goes through email.
 */
const FAQS = [
  {
    q: 'How do I track my order?',
    a: 'Open My orders and pick the order — the progress timeline shows every status change (Pending → Confirmed → Shipped → Delivered) with timestamps.',
    to: '/orders',
    cta: 'Go to my orders',
  },
  {
    q: 'Can I cancel an order?',
    a: 'Yes, while it is still Pending or Confirmed. Once it has shipped, cancellation is no longer available from your account. Reserved stock is returned automatically when you cancel.',
  },
  {
    q: 'What does delivery cost?',
    a: 'Orders of ₹999 or more ship free. Below that a flat ₹49 delivery fee applies. Tax (5%) is shown on the checkout summary before you place the order.',
  },
  {
    q: 'Which payment methods are supported?',
    a: 'Cash on delivery — you pay when the parcel arrives. No card details are ever collected on this site.',
  },
  {
    q: 'How do I change my delivery address?',
    a: 'Saved addresses live under Addresses in your account. You can add, edit and set a default address; the default is pre-selected at checkout.',
    to: '/addresses',
    cta: 'Manage addresses',
  },
  {
    q: 'How do I write or remove a review?',
    a: 'Rate a product from its page once you have bought it. All of your reviews are listed under My reviews, where you can remove one at any time.',
    to: '/reviews',
    cta: 'My reviews',
  },
  {
    q: 'I forgot my password',
    a: 'Use "Forgot password" on the login page. If you signed up with Google or Apple you can set a password the same way and then use either method.',
    to: '/settings',
    cta: 'Account settings',
  },
];

const SUPPORT_EMAIL = 'support@shopsphere.dev';

const SupportPage = () => {
  const [open, setOpen] = useState(0);

  return (
    <div className="min-w-0">
      <PageHeader
        eyebrow="Account"
        title="Help & support"
        description="Answers to the common questions, and how to reach us for anything else."
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Dashboard', to: '/dashboard' }, { label: 'Help & support' }]}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* FAQ */}
        <section className="lg:col-span-2" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-lg font-bold">Frequently asked questions</h2>
          <div className="mt-4 divide-y divide-ink-100 overflow-hidden rounded-2xl border border-ink-200/80 bg-surface shadow-card">
            {FAQS.map((item, index) => {
              const expanded = open === index;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    onClick={() => setOpen(expanded ? -1 : index)}
                    aria-expanded={expanded}
                    aria-controls={`faq-${index}`}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-ink-900 transition hover:bg-ink-50"
                  >
                    {item.q}
                    <svg className={cn('h-4 w-4 shrink-0 text-ink-400 transition-transform duration-200', expanded && 'rotate-180')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  {expanded && (
                    <div id={`faq-${index}`} className="px-5 pb-5 text-sm leading-relaxed text-ink-600 animate-fade-in">
                      <p>{item.a}</p>
                      {item.to && (
                        <Link to={item.to} className="link mt-2 inline-block text-sm">{item.cta} →</Link>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Contact + quick links */}
        <aside className="space-y-4">
          <section className="relative overflow-hidden rounded-2xl bg-night-400 p-5 text-white noise">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-600/50 blur-3xl" aria-hidden="true" />
            <div className="relative">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">Still stuck?</p>
              <h3 className="mt-1.5 text-white">Email our team</h3>
              <p className="mt-1.5 text-sm text-white/65">
                Include your order number (it starts with <span className="font-mono">ORD-</span>) and we will reply within one business day.
              </p>
              <Button href={`mailto:${SUPPORT_EMAIL}`} variant="onBrand" className="mt-4 w-full" size="md">
                {SUPPORT_EMAIL}
              </Button>
            </div>
          </section>

          <section className="card p-5">
            <h3 className="text-base font-bold">Quick links</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {[
                ['/orders', 'Track an order'],
                ['/addresses', 'Update delivery address'],
                ['/settings', 'Change my password'],
                ['/cart', 'Review my cart'],
                ['/products', 'Browse the catalogue'],
              ].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="flex items-center justify-between rounded-xl px-3 py-2 text-ink-700 transition hover:bg-ink-50 hover:text-brand-700">
                    {label}
                    <span aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default SupportPage;
