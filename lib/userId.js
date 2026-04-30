'use client';

import { v4 as uuidv4 } from 'uuid';

const KEY = 'smart_sheduler_device_id';

export function getDeviceId() {
  if (typeof window === 'undefined') return null;
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(KEY, id);
  }
  return id;
}

// Wraps fetch to inject the deviceId as x-user-id on every API call.
export async function apiFetch(path, options = {}) {
  const userId = getDeviceId();
  const headers = { ...(options.headers || {}), 'x-user-id': userId || '' };
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(path, { ...options, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let parsed = null;
    if (text) {
      try { parsed = JSON.parse(text); } catch { /* not JSON */ }
    }
    if (parsed && typeof parsed === 'object' && parsed.error) {
      throw new Error(parsed.error);
    }
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return res.json();
}
