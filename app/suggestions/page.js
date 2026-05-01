'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PhoneFrame from '../../components/ui/PhoneFrame';
import AppHeader from '../../components/ui/AppHeader';
import Greeting from '../../components/ui/Greeting';
import Icon from '../../components/ui/Icon';
import SuggestionCard from '../../components/features/SuggestionCard';
import { SuggestionCardSkel, SkelStack } from '../../components/ui/Skeletons';
import { apiFetch } from '../../lib/userId';

// Map a suggestion id to a dispatch kind. Suggestions emitted by lib/suggestions.js
// use prefixes `gap-`, `recur-`, `dur-`. We also accept the spec-named prefixes
// `recurring-`, `duration-`, `cluster-` for forward-compat.
function dispatchKind(id) {
  if (!id || typeof id !== 'string') return null;
  if (id.startsWith('gap-') || id.startsWith('cluster-')) return 'navigate-tasks';
  if (id.startsWith('recur-') || id.startsWith('recurring-')) return 'dismiss-noted';
  if (id.startsWith('dur-') || id.startsWith('duration-')) return 'dismiss-noted';
  return null;
}

export default function SuggestionsPage() {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState(null);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toastTimer = useRef(null);
  // Local mirror of the user's persisted dismissed list, so we never re-add an id.
  const dismissedRef = useRef([]);

  useEffect(() => {
    let cancelled = false;
    let fetchError = null;
    Promise.all([
      apiFetch('/api/suggestions').catch((err) => {
        fetchError = err?.message || 'Failed to load';
        if (!cancelled) setError(fetchError);
        return { suggestions: [] };
      }),
      apiFetch('/api/preferences').catch(() => ({})),
    ]).then(([sugData, prefs]) => {
      if (cancelled) return;
      const list = Array.isArray(sugData) ? sugData : sugData?.suggestions || [];
      setSuggestions(list);
      const dismissed = Array.isArray(prefs?.dismissedSuggestions)
        ? prefs.dismissedSuggestions
        : [];
      dismissedRef.current = dismissed;
      // Surface the fetch error inline regardless of whether we have stale
      // results to show — silent failures here lead to confusing empty states.
      if (fetchError) {
        showToast(`Couldn't refresh suggestions — ${fetchError}`, 5000);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const sugData = await apiFetch('/api/suggestions');
      const list = Array.isArray(sugData) ? sugData : sugData?.suggestions || [];
      setSuggestions(list);
      setError(null);
    } catch (err) {
      const msg = err?.message || 'Failed to load';
      setError(msg);
      showToast(`Couldn't refresh suggestions — ${msg}`, 4000);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const showToast = (message, ms = 3000) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), ms);
  };

  // Persist a dismissal to /api/preferences. Optimistic removal happens at call site.
  // Returns a Promise that rejects on failure so the caller can roll back.
  const persistDismiss = async (id) => {
    if (dismissedRef.current.includes(id)) return; // already persisted, no-op
    const next = [...dismissedRef.current, id];
    const prevDismissed = dismissedRef.current;
    dismissedRef.current = next;
    try {
      await apiFetch('/api/preferences', {
        method: 'PUT',
        body: JSON.stringify({ dismissedSuggestions: next }),
      });
    } catch (err) {
      dismissedRef.current = prevDismissed;
      throw err;
    }
  };

  const handleDismiss = async (s) => {
    const prev = suggestions || [];
    setSuggestions(prev.filter((x) => x.id !== s.id));
    try {
      await persistDismiss(s.id);
    } catch (err) {
      // Roll back the local removal.
      setSuggestions(prev);
      showToast(`Couldn't dismiss — ${err?.message || 'try again'}`, 4000);
    }
  };

  const handleAct = async (s) => {
    const kind = dispatchKind(s.id);
    if (!kind) return;

    if (kind === 'navigate-tasks') {
      router.push('/tasks');
      return;
    }

    if (kind === 'dismiss-noted') {
      const prev = suggestions || [];
      setSuggestions(prev.filter((x) => x.id !== s.id));
      try {
        await persistDismiss(s.id);
        showToast("Noted — we'll suggest this less often");
      } catch (err) {
        setSuggestions(prev);
        showToast(`Couldn't save — ${err?.message || 'try again'}`, 4000);
      }
    }
  };

  const count = suggestions?.length ?? 0;
  const dateLabel = suggestions === null ? 'Loading…' : `${count} ideas for today`;

  return (
    <PhoneFrame>
      <AppHeader
        left={
          <Link href="/settings" className="ss-iconbtn" aria-label="Back">
            <Icon name="arrowL" size={16} />
          </Link>
        }
        center={<Greeting day="SUGGESTIONS" date={dateLabel} />}
        right={
          <button
            type="button"
            className="ss-iconbtn"
            onClick={handleRefresh}
            disabled={isRefreshing || suggestions === null}
            aria-label="Refresh suggestions"
            style={{
              opacity: isRefreshing || suggestions === null ? 0.5 : 1,
              cursor: isRefreshing || suggestions === null ? 'default' : 'pointer',
            }}
          >
            <Icon name="repeat" size={16} />
          </button>
        }
      />

      <div
        style={{ padding: '0 16px', flex: 1, overflowY: 'auto', position: 'relative' }}
        className="ss-scroll"
      >
        {suggestions === null ? (
          <div className="ss-stack ss-stack-loose">
            <SkelStack component={SuggestionCardSkel} count={3} />
          </div>
        ) : (
          <div className="ss-stack ss-stack-loose">
            {error && suggestions.length > 0 ? (
              <div
                role="alert"
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  background: 'var(--surface-1)',
                  border: '1px solid var(--hairline)',
                  color: 'var(--prio)',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  textAlign: 'center',
                }}
              >
                Showing cached suggestions — couldn’t refresh.
              </div>
            ) : null}
            {suggestions.map((s) => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                onDismiss={handleDismiss}
                onAct={handleAct}
                showAct={Boolean(dispatchKind(s.id))}
              />
            ))}
            {suggestions.length === 0 ? (
              <div
                style={{
                  padding: '20px 8px',
                  color: 'var(--fg-3)',
                  fontSize: 12,
                  textAlign: 'center',
                }}
              >
                {error ? `Couldn't load suggestions.` : 'No suggestions right now.'}
              </div>
            ) : null}
          </div>
        )}
        <div style={{ height: 16 }} />
      </div>

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="ss-card"
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 24,
            padding: '10px 12px',
            fontSize: 12,
            color: 'var(--fg)',
            background: 'var(--surface-1)',
            border: '1px solid var(--hairline)',
            boxShadow: 'var(--shadow-md)',
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            zIndex: 5,
          }}
        >
          {toast}
        </div>
      ) : null}
    </PhoneFrame>
  );
}
