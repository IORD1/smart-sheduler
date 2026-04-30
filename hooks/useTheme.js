'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../lib/userId';

const ACCENT_PRESETS = {
  lime:  { go: '#C5FF4A', glow: 'rgba(197,255,74,0.18)', fg: '#0A0F00' },
  sky:   { go: '#5DC7F5', glow: 'rgba(93,199,245,0.22)', fg: '#001624' },
  rose:  { go: '#FF7AB6', glow: 'rgba(255,122,182,0.22)', fg: '#220018' },
  amber: { go: '#FFB347', glow: 'rgba(255,179,71,0.22)', fg: '#221400' },
};

const THEME_KEY = 'smart_sheduler_theme';
const ACCENT_KEY = 'smart_sheduler_accent';

function readStored(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    return window.localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key, value) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(key, value); } catch { /* ignore */ }
}

function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
}

function applyAccent(accent) {
  if (typeof document === 'undefined') return;
  const preset = ACCENT_PRESETS[accent] || ACCENT_PRESETS.lime;
  const s = document.documentElement.style;
  s.setProperty('--go', preset.go);
  s.setProperty('--go-glow', preset.glow);
  s.setProperty('--go-fg', preset.fg);
}

export function useTheme() {
  const [theme, setThemeState] = useState(() => readStored(THEME_KEY, 'dark'));
  const [accent, setAccentState] = useState(() => readStored(ACCENT_KEY, 'lime'));
  const userTouchedRef = useRef(false);

  // Re-apply on mount in case the inline bootstrap script didn't run (SSR-only fallback).
  useEffect(() => {
    applyTheme(theme);
    applyAccent(accent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hydrate from /api/preferences once. Skip if user already toggled.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await apiFetch('/api/preferences');
        if (!alive || userTouchedRef.current) return;
        if (data && typeof data === 'object') {
          const nextTheme = data.theme || theme;
          const nextAccent = data.accent || accent;
          if (nextTheme !== theme) {
            setThemeState(nextTheme);
            applyTheme(nextTheme);
            writeStored(THEME_KEY, nextTheme);
          }
          if (nextAccent !== accent) {
            setAccentState(nextAccent);
            applyAccent(nextAccent);
            writeStored(ACCENT_KEY, nextAccent);
          }
        }
      } catch {
        // fall back to stored / defaults
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = useCallback(async (v) => {
    userTouchedRef.current = true;
    setThemeState(v);
    applyTheme(v);
    writeStored(THEME_KEY, v);
    try {
      await apiFetch('/api/preferences', {
        method: 'PUT',
        body: JSON.stringify({ theme: v }),
      });
    } catch {
      // ignore — local state and storage already updated
    }
  }, []);

  const setAccent = useCallback(async (v) => {
    userTouchedRef.current = true;
    setAccentState(v);
    applyAccent(v);
    writeStored(ACCENT_KEY, v);
    try {
      await apiFetch('/api/preferences', {
        method: 'PUT',
        body: JSON.stringify({ accent: v }),
      });
    } catch {
      // ignore
    }
  }, []);

  return { theme, accent, setTheme, setAccent };
}

export default useTheme;
