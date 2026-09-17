import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { cartApi } from '@/api';
import { STORAGE_KEYS } from '@/constants';
import { readJson, writeJson, remove } from '@/utils/storage';
import { useAuthContext } from './AuthContext';
import { useToastContext } from './ToastContext';

const CartContext = createContext(null);

const EMPTY_SUMMARY = {
  itemsCount: 0,
  totalQuantity: 0,
  subtotal: 0,
  savings: 0,
  shipping: 0,
  tax: 0,
  total: 0,
};

/* ------------------------------------------------------------------ */
/* Guest cart — browser-only, merged into the server cart on login.    */
/* ------------------------------------------------------------------ */

const readGuestCart = () => readJson(STORAGE_KEYS.guestCart, []);

/**
 * Guest lines carry a display snapshot of the product. Shipping and tax are
 * deliberately NOT computed here: those rules live on the server, and the real
 * totals appear as soon as the customer signs in.
 */
const buildGuestPayload = (items) => {
  const lines = items.map((item) => ({
    product: item.product,
    quantity: item.quantity,
    unitPrice: item.product.effectivePrice,
    subtotal: Math.round(item.product.effectivePrice * item.quantity * 100) / 100,
    maxQuantity: item.product.stock,
  }));

  const subtotal = Math.round(lines.reduce((sum, line) => sum + line.subtotal, 0) * 100) / 100;

  return {
    items: lines,
    summary: {
      ...EMPTY_SUMMARY,
      itemsCount: lines.length,
      totalQuantity: lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotal,
      total: subtotal,
      savings:
        Math.round(
          lines.reduce(
            (sum, line) => sum + Math.max(0, line.product.price - line.unitPrice) * line.quantity,
            0
          ) * 100
        ) / 100,
      isEstimate: true,
    },
    notices: [],
  };
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuthContext();
  const { toast } = useToastContext();

  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);

  const mergedForUser = useRef(null);

  const applyServerPayload = useCallback((payload) => {
    setItems(payload.items ?? []);
    setSummary(payload.summary ?? EMPTY_SUMMARY);
    setNotices(payload.notices ?? []);
  }, []);

  const applyGuestCart = useCallback((guestItems) => {
    const payload = buildGuestPayload(guestItems);
    setItems(payload.items);
    setSummary(payload.summary);
    setNotices([]);
  }, []);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      applyGuestCart(readGuestCart());
      return;
    }

    setLoading(true);
    try {
      const response = await cartApi.get();
      applyServerPayload(response.data);

      // Surface anything the server repaired (removed or reduced lines).
      (response.data.notices ?? []).forEach((notice) => toast.warning(notice.message));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, applyGuestCart, applyServerPayload, toast]);

  /* Merge the guest cart once, right after a successful login. */
  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (!isAuthenticated) mergedForUser.current = null;
      return;
    }

    if (mergedForUser.current === user._id) return;
    mergedForUser.current = user._id;

    const guestItems = readGuestCart();

    const sync = async () => {
      setLoading(true);
      try {
        if (guestItems.length) {
          const response = await cartApi.merge(
            guestItems.map((item) => ({
              productId: item.product._id,
              quantity: item.quantity,
              name: item.product.name,
            }))
          );
          applyServerPayload(response.data);
          remove(STORAGE_KEYS.guestCart);
          toast.success('Your saved cart has been restored.');
        } else {
          const response = await cartApi.get();
          applyServerPayload(response.data);
        }
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    sync();
  }, [isAuthenticated, user, applyServerPayload, toast]);

  /* Guests: hydrate from localStorage. */
  useEffect(() => {
    if (!isAuthenticated) applyGuestCart(readGuestCart());
  }, [isAuthenticated, applyGuestCart]);

  const persistGuestCart = useCallback(
    (nextItems) => {
      writeJson(STORAGE_KEYS.guestCart, nextItems);
      applyGuestCart(nextItems);
    },
    [applyGuestCart]
  );

  const addItem = useCallback(
    async (product, quantity = 1) => {
      if (product.stock <= 0) {
        toast.error(`"${product.name}" is out of stock.`);
        return false;
      }

      setMutating(true);
      try {
        if (isAuthenticated) {
          const response = await cartApi.add(product._id, quantity);
          applyServerPayload(response.data);
          toast.success(response.message);
          return true;
        }

        const current = readGuestCart();
        const existing = current.find((item) => item.product._id === product._id);
        const nextQuantity = (existing?.quantity ?? 0) + quantity;

        if (nextQuantity > product.stock) {
          toast.error(`Only ${product.stock} unit(s) of "${product.name}" are available.`);
          return false;
        }

        const snapshot = {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          image: product.images?.[0]?.url ?? product.image ?? '',
          brand: product.brand,
          price: product.price,
          effectivePrice: product.effectivePrice ?? product.discountPrice ?? product.price,
          stock: product.stock,
        };

        const next = existing
          ? current.map((item) =>
              item.product._id === product._id ? { ...item, quantity: nextQuantity } : item
            )
          : [...current, { product: snapshot, quantity }];

        persistGuestCart(next);
        toast.success(`"${product.name}" added to your cart.`);
        return true;
      } catch (error) {
        toast.error(error.message);
        return false;
      } finally {
        setMutating(false);
      }
    },
    [isAuthenticated, applyServerPayload, persistGuestCart, toast]
  );

  const updateItem = useCallback(
    async (productId, quantity) => {
      setMutating(true);
      try {
        if (isAuthenticated) {
          const response = await cartApi.update(productId, quantity);
          applyServerPayload(response.data);
          return true;
        }

        const current = readGuestCart();
        const next =
          quantity <= 0
            ? current.filter((item) => item.product._id !== productId)
            : current.map((item) =>
                item.product._id === productId
                  ? { ...item, quantity: Math.min(quantity, item.product.stock) }
                  : item
              );

        persistGuestCart(next);
        return true;
      } catch (error) {
        toast.error(error.message);
        return false;
      } finally {
        setMutating(false);
      }
    },
    [isAuthenticated, applyServerPayload, persistGuestCart, toast]
  );

  const removeItem = useCallback(
    async (productId) => {
      setMutating(true);
      try {
        if (isAuthenticated) {
          const response = await cartApi.remove(productId);
          applyServerPayload(response.data);
          toast.info(response.message);
          return true;
        }

        persistGuestCart(readGuestCart().filter((item) => item.product._id !== productId));
        toast.info('Item removed from your cart.');
        return true;
      } catch (error) {
        toast.error(error.message);
        return false;
      } finally {
        setMutating(false);
      }
    },
    [isAuthenticated, applyServerPayload, persistGuestCart, toast]
  );

  const clear = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (isAuthenticated) {
          const response = await cartApi.clear();
          applyServerPayload(response.data);
        } else {
          persistGuestCart([]);
        }
        if (!silent) toast.info('Cart cleared.');
      } catch (error) {
        toast.error(error.message);
      }
    },
    [isAuthenticated, applyServerPayload, persistGuestCart, toast]
  );

  /** Called after checkout — the server already emptied the cart. */
  const resetAfterCheckout = useCallback(() => {
    setItems([]);
    setSummary(EMPTY_SUMMARY);
    setNotices([]);
  }, []);

  const value = useMemo(
    () => ({
      items,
      summary,
      notices,
      loading,
      mutating,
      itemCount: summary.totalQuantity ?? 0,
      isEmpty: items.length === 0,
      quantityOf: (productId) =>
        items.find((item) => item.product._id === productId)?.quantity ?? 0,
      addItem,
      updateItem,
      removeItem,
      clear,
      refresh,
      resetAfterCheckout,
    }),
    [items, summary, notices, loading, mutating, addItem, updateItem, removeItem, clear, refresh, resetAfterCheckout]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside <CartProvider>');
  return context;
};

export default CartContext;
