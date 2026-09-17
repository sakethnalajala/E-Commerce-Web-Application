import { authApi } from '@/api';
import useApiResource from '@/hooks/useApiResource';
import { DEMO_ACCOUNTS } from '@/constants';

/**
 * The demo customer offered on the login page.
 *
 * Locally configured VITE_DEMO_CUSTOMER_* values win, so a developer can point
 * the button at their own seeded account. Otherwise the server decides: it
 * only advertises an account it has verified is an active customer whose
 * password works (see demoAccount.service.js). Nothing is hardcoded here —
 * credentials never enter the shipped bundle.
 *
 * The request is the same GET /auth/providers the social buttons make, and the
 * API client de-duplicates it, so this costs no extra round trip.
 */
const useDemoAccount = () => {
  const local = DEMO_ACCOUNTS.customer;
  const resource = useApiResource(() => authApi.providers(), [], { immediate: !local });

  if (local) return { account: local, loading: false };
  return { account: resource.data?.demo?.customer ?? null, loading: resource.loading };
};

export default useDemoAccount;
