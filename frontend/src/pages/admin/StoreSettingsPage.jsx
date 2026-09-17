import { adminApi } from '@/api';
import { formatCurrency } from '@/utils/format';
import useApiResource from '@/hooks/useApiResource';
import PageHeader from '@/components/common/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Alert, ErrorState } from '@/components/ui/States';
import { LoadingBlock } from '@/components/ui/Spinner';

const Row = ({ label, value, hint }) => (
  <div className="flex items-start justify-between gap-6 py-3.5">
    <div>
      <p className="text-sm font-semibold text-ink-900">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-500">{hint}</p>}
    </div>
    <div className="shrink-0 text-right text-sm font-semibold text-ink-900">{value}</div>
  </div>
);

const Section = ({ title, description, children }) => (
  <section className="card p-6">
    <h2 className="text-base font-bold">{title}</h2>
    {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
    <div className="mt-3 divide-y divide-ink-100">{children}</div>
  </section>
);

const Status = ({ ok, okLabel = 'Configured', badLabel = 'Not configured' }) => (
  ok ? <Badge tone="success" dot>{okLabel}</Badge> : <Badge tone="warning" dot>{badLabel}</Badge>
);

/**
 * Store & delivery settings. Every rule shown here is what the API enforces
 * right now. They are deliberately read-only: pricing lives in environment
 * variables so it can never be changed from a browser session.
 */
const StoreSettingsPage = () => {
  const resource = useApiResource(() => adminApi.settings(), []);

  if (resource.loading) return <LoadingBlock label="Loading settings…" />;
  if (resource.error) return <ErrorState title="Could not load settings" error={resource.error} onRetry={resource.reload} />;

  const { pricing, inventory, checkout, security, integrations, environment } = resource.data ?? {};

  return (
    <div>
      <PageHeader
        title="Store settings"
        description="The rules the server applies to every cart, checkout and stock check."
        actions={<Button variant="outline" onClick={resource.reload}>Refresh</Button>}
      />

      <Alert tone="info" className="mt-6">
        These values are read from the backend's environment (<code>backend/.env</code>, or the Render dashboard in
        production) and take effect on restart. Editing them from the browser is intentionally not supported.
      </Alert>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Section title="Pricing & delivery" description="Applied when the server computes every cart and order total.">
          <Row label="Currency" value={pricing.currency} />
          <Row label="Free shipping threshold" value={formatCurrency(pricing.freeShippingThreshold)} hint="Orders at or above this ship free" />
          <Row label="Shipping fee" value={formatCurrency(pricing.shippingFee)} hint="Flat fee below the threshold" />
          <Row label="Tax rate" value={`${Math.round(pricing.taxRate * 100)}%`} hint="Applied to the items subtotal" />
        </Section>

        <Section title="Checkout & orders" description="Payment and cancellation rules.">
          <Row label="Payment methods" value={checkout.paymentMethods.join(', ')} />
          <Row label="Customer can cancel while" value={checkout.customerCancellableStatuses.join(' or ')} hint="Stock is returned automatically" />
          <Row label="Low-stock threshold" value={`${inventory.lowStockThreshold} units`} hint="Flags products in Inventory and on the dashboard" />
        </Section>

        <Section title="Integrations" description="Services the API talks to.">
          <Row label="Database" value={<Status ok={integrations.database.mode === 'atlas'} okLabel={`MongoDB Atlas · ${integrations.database.name}`} badLabel={integrations.database.mode} />} />
          <Row label="Image storage (Cloudinary)" value={<Status ok={integrations.cloudinary.configured} />} hint={integrations.cloudinary.configured ? `Uploads go to ${integrations.cloudinary.folder}` : 'Product image uploads return 503 until configured'} />
          <Row label="Email (SMTP)" value={<Status ok={integrations.email.configured} badLabel="Not configured" />} hint={integrations.email.configured ? 'Password-reset emails are delivered' : 'Reset links are logged on the server in development'} />
        </Section>

        <Section title="Security" description="Session and abuse protection.">
          <Row label="Environment" value={<Badge tone={environment === 'production' ? 'success' : 'brand'}>{environment}</Badge>} />
          <Row label="Session lifetime" value={security.jwtExpiresIn} hint="JWT expiry; tokens are also revoked on password change" />
          <Row label="Password reset link expires" value={`${security.passwordResetMinutes} min`} />
          <Row label="Rate limit" value={`${security.rateLimitMax} req / ${security.rateLimitWindowMinutes} min`} hint="Per IP, across the whole API" />
        </Section>
      </div>
    </div>
  );
};

export default StoreSettingsPage;
