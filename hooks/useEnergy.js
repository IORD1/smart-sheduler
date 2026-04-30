'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/userId';

export function useEnergy() {
  const [windows, setWindows] = useState([]);
  const [hasInitialized, setHasInitialized] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await apiFetch('/api/energy');
        if (!alive) return;
        setWindows(Array.isArray(data?.windows) ? data.windows : []);
        setHasInitialized(data?.hasInitialized === true);
      } catch {
        if (alive) {
          setWindows([]);
          setHasInitialized(false);
        }
      } finally {
        if (alive) setIsLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Save returns a Promise that resolves to {ok: true} or rejects with the error.
  const save = useCallback(async (next, opts = {}) => {
    const arr = Array.isArray(next) ? next : [];
    const prev = windows;
    setWindows(arr);
    try {
      const body = { windows: arr };
      if (Object.prototype.hasOwnProperty.call(opts, 'hasInitialized')) {
        body.hasInitialized = opts.hasInitialized === true;
      }
      await apiFetch('/api/energy', {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      if (Object.prototype.hasOwnProperty.call(opts, 'hasInitialized')) {
        setHasInitialized(opts.hasInitialized === true);
      }
      return { ok: true };
    } catch (err) {
      // Roll back optimistic update so the caller can re-try cleanly.
      setWindows(prev);
      throw err;
    }
  }, [windows]);

  return { windows, hasInitialized, isLoading, save };
}

export default useEnergy;
