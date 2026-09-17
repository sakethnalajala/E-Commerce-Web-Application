import { useCallback, useEffect, useRef, useState } from 'react';
import { invalidateGetCache } from '@/api/client';

/**
 * Runs an async API call and tracks { data, meta, loading, error }.
 * Handles the two things every page needs: a reload trigger, and ignoring a
 * response that arrives after the component unmounted or the params changed.
 *
 *   const { data, loading, error, reload } = useApiResource(
 *     () => productApi.list(params), [params]
 *   );
 */
export const useApiResource = (fetcher, deps = [], { immediate = true, initialData = null } = {}) => {
  const [data, setData] = useState(initialData);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const requestId = useRef(0);
  const mounted = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async ({ fresh = false } = {}) => {
    // A manual reload (retry button, after an edit) must hit the server.
    if (fresh) invalidateGetCache();
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);

    try {
      const response = await fetcherRef.current();
      // Drop stale responses from superseded requests.
      if (!mounted.current || currentRequest !== requestId.current) return null;

      setData(response?.data ?? null);
      setMeta(response?.meta ?? null);
      return response;
    } catch (caught) {
      if (!mounted.current || currentRequest !== requestId.current) return null;
      if (caught.cancelled) return null;
      setError(caught);
      return null;
    } finally {
      if (mounted.current && currentRequest === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (immediate) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const reload = useCallback(() => run({ fresh: true }), [run]);

  return { data, meta, loading, error, reload, setData };
};

export default useApiResource;
