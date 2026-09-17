import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import ToastViewport from '@/components/ui/ToastViewport';

const ToastContext = createContext(null);

const AUTO_DISMISS_MS = 4500;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (message, { type = 'info', title, duration = AUTO_DISMISS_MS } = {}) => {
      if (!message) return null;

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      // Cap the stack so a burst of failures cannot cover the page.
      setToasts((current) => [...current.slice(-3), { id, message, type, title }]);

      if (duration > 0) {
        timers.current.set(id, setTimeout(() => dismiss(id), duration));
      }

      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      toasts,
      dismiss,
      toast: {
        success: (message, options) => push(message, { ...options, type: 'success' }),
        error: (message, options) => push(message, { ...options, type: 'error' }),
        info: (message, options) => push(message, { ...options, type: 'info' }),
        warning: (message, options) => push(message, { ...options, type: 'warning' }),
      },
    }),
    [toasts, dismiss, push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
};

export default ToastContext;
