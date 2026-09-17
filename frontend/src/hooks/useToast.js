import { useToastContext } from '@/context/ToastContext';

/** Returns { success, error, info, warning } notification helpers. */
export const useToast = () => useToastContext().toast;

export default useToast;
