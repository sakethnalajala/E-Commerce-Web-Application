import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import { ROLES, HOME_FOR_ROLE } from '@/constants';
import { LoadingBlock } from '@/components/ui/Spinner';
import AccessDeniedPage from '@/pages/AccessDeniedPage';

/** Blocks anonymous visitors and remembers where they were headed. */
export const ProtectedRoute = () => {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <LoadingBlock label="Checking your session…" className="min-h-[60vh]" />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  return <Outlet />;
};

/**
 * Admin gate. Anonymous visitors go to the admin sign-in; a signed-in customer
 * sees an explicit 403 page rather than being silently bounced. The API
 * enforces the same rule on every admin endpoint regardless.
 */
export const AdminRoute = () => {
  const { isAuthenticated, user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <LoadingBlock label="Checking permissions…" className="min-h-screen" />;
  if (!isAuthenticated) return <Navigate to="/admin/login" state={{ from: location }} replace />;
  if (user?.role !== ROLES.ADMIN) {
    // The console's front door (/admin — where every "Admin" link points) takes a
    // customer to the admin sign-in so they can switch accounts. Deep links to
    // protected console pages get the explicit 403 instead of a silent bounce.
    if (location.pathname.replace(/\/+$/, '') === '/admin') {
      return <Navigate to="/admin/login" state={{ from: location, adminRequired: true }} replace />;
    }
    return <AccessDeniedPage />;
  }

  return <Outlet />;
};

/** Keeps signed-in users off the login/register pages, sending them home by role. */
export const GuestRoute = () => {
  const { isAuthenticated, initializing, user } = useAuth();

  if (initializing) return <LoadingBlock label="Loading…" className="min-h-[60vh]" />;
  if (isAuthenticated) return <Navigate to={HOME_FOR_ROLE[user?.role] ?? '/dashboard'} replace />;

  return <Outlet />;
};
