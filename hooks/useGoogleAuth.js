'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { init, subscribe, getState, signIn, signOut, getUserEmail } from '../services/googleCalendar';

const serverSnapshot = { ready: false, token: null, expiresIn: null, email: null };

export function useGoogleAuth() {
  const state = useSyncExternalStore(
    subscribe,
    getState,
    () => serverSnapshot,
  );
  useEffect(() => {
    init().catch((err) => console.error('google init failed', err));
  }, []);
  useEffect(() => {
    if (state.ready && state.token && !state.email) {
      getUserEmail().catch(() => {});
    }
  }, [state.ready, state.token, state.email]);
  return { ...state, signIn, signOut };
}
