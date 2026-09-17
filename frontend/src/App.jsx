import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import ScrollToTop from '@/components/common/ScrollToTop';
import AppRoutes from '@/routes/AppRoutes';

/**
 * Provider order matters: the theme wraps everything (even error screens),
 * toasts are used by auth, and auth state drives whether the cart lives on
 * the server or in the browser.
 */
const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <ScrollToTop />
              <AppRoutes />
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
