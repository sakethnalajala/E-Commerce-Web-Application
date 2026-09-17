import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import PublicLayout from '@/layouts/PublicLayout';
import AuthLayout from '@/layouts/AuthLayout';
import AccountLayout from '@/layouts/AccountLayout';
import AdminLayout from '@/layouts/AdminLayout';
import { ProtectedRoute, AdminRoute, GuestRoute } from '@/components/common/RouteGuards';
import { LoadingBlock } from '@/components/ui/Spinner';

/* Storefront pages load eagerly — they are the first thing most visitors see. */
import HomePage from '@/pages/HomePage';
import ProductsPage from '@/pages/ProductsPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import NotFoundPage from '@/pages/NotFoundPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import AdminLoginPage from '@/pages/auth/AdminLoginPage';
import CartPage from '@/pages/customer/CartPage';
import CheckoutPage from '@/pages/customer/CheckoutPage';
import OrdersPage from '@/pages/customer/OrdersPage';
import OrderDetailPage from '@/pages/customer/OrderDetailPage';
import ProfilePage from '@/pages/customer/ProfilePage';
import CustomerDashboardPage from '@/pages/customer/CustomerDashboardPage';

/* The admin console is code-split: customers never download it. */
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const AnalyticsPage = lazy(() => import('@/pages/admin/AnalyticsPage'));
const AdminProductsPage = lazy(() => import('@/pages/admin/AdminProductsPage'));
const ProductFormPage = lazy(() => import('@/pages/admin/ProductFormPage'));
const AdminCategoriesPage = lazy(() => import('@/pages/admin/AdminCategoriesPage'));
const AdminOrdersPage = lazy(() => import('@/pages/admin/AdminOrdersPage'));
const AdminOrderDetailPage = lazy(() => import('@/pages/admin/AdminOrderDetailPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminUserDetailPage = lazy(() => import('@/pages/admin/AdminUserDetailPage'));
const MyReviewsPage = lazy(() => import('@/pages/customer/MyReviewsPage'));
const SupportPage = lazy(() => import('@/pages/customer/SupportPage'));
const InventoryPage = lazy(() => import('@/pages/admin/InventoryPage'));
const AdminReviewsPage = lazy(() => import('@/pages/admin/AdminReviewsPage'));
const DiscountsPage = lazy(() => import('@/pages/admin/DiscountsPage'));
const StoreSettingsPage = lazy(() => import('@/pages/admin/StoreSettingsPage'));
const ReportsPage = lazy(() => import('@/pages/admin/ReportsPage'));
const AdminProfilePage = lazy(() => import('@/pages/admin/AdminProfilePage'));

const AppRoutes = () => (
  <Routes>
    {/* Storefront */}
    <Route element={<PublicLayout />}>
      <Route index element={<HomePage />} />
      <Route path="products" element={<ProductsPage />} />
      <Route path="products/:identifier" element={<ProductDetailPage />} />
      <Route path="cart" element={<CartPage />} />

      {/* Signed-in customers only */}
      <Route element={<ProtectedRoute />}>
        <Route path="checkout" element={<CheckoutPage />} />
        {/* Account area: shares the customer sidebar */}
        <Route element={<AccountLayout />}>
          <Route path="dashboard" element={<CustomerDashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="profile" element={<ProfilePage section="profile" />} />
          <Route path="addresses" element={<ProfilePage section="addresses" />} />
          <Route path="settings" element={<ProfilePage section="security" />} />
          <Route path="reviews" element={<MyReviewsPage />} />
          <Route path="support" element={<SupportPage />} />
        </Route>
      </Route>
    </Route>

    {/* Credentials */}
    <Route element={<AuthLayout />}>
      <Route element={<GuestRoute />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
      </Route>
      {/* Separate admin sign-in: no registration, no social sign-in. Open to
          guests and to signed-in customers (who switch to an admin session);
          the page itself sends existing admins straight to the console. */}
      <Route path="admin/login" element={<AdminLoginPage />} />
      {/* Reachable while logged in too — the link may arrive at any time. */}
      <Route path="reset-password/:token" element={<ResetPasswordPage />} />
    </Route>

    {/* Admin console */}
    <Route element={<AdminRoute />}>
      <Route
        path="admin"
        element={
          <Suspense fallback={<LoadingBlock label="Loading admin console…" className="min-h-screen" />}>
            <AdminLayout />
          </Suspense>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="products/new" element={<ProductFormPage />} />
        <Route path="products/:id/edit" element={<ProductFormPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="orders/:id" element={<AdminOrderDetailPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="users/:id" element={<AdminUserDetailPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="reviews" element={<AdminReviewsPage />} />
        <Route path="discounts" element={<DiscountsPage />} />
        <Route path="settings" element={<StoreSettingsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
      </Route>
    </Route>

    {/* Catch-all */}
    <Route element={<PublicLayout />}>
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>
);

export default AppRoutes;
