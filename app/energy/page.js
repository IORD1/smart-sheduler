'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import PhoneFrame from '../../components/ui/PhoneFrame';
import AppHeader from '../../components/ui/AppHeader';
import Greeting from '../../components/ui/Greeting';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import EnergyWindowRow from '../../components/features/EnergyWindowRow';
import { useEnergy } from '../../hooks/useEnergy';

const DEFAULT_WINDOWS = [
  { label: 'Morning peak',  startMin: 8 * 60,  endMin: 11 * 60, level: 3, type: 'focus',    note: 'Deep work' },
  { label: 'Mid-morning',   startMin: 11 * 60, endMin: 13 * 60, level: 2, type: 'work',     note: 'Meetings OK' },
  { label: 'Afternoon dip', startMin: 13 * 60, endMin: 15 * 60, level: 1, type: 'errand',   note: 'Admin / email' },
  { label: 'Second wind',   startMin: 15 * 60, endMin: 18 * 60, level: 2, type: 'work',     note: 'Collab' },
  { label: 'Evening',       startMin: 18 * 60, endMin: 22 * 60, level: 2, type: 'personal', note: 'Personal' },
];

export default function EnergyPage() {
  const { windows, hasInitialized, isLoading, save } = useEnergy();
  const [draft, setDraft] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { kind: 'ok'|'err', message }
  const toastTimer = useRef(null);
  const seededRef = useRef(false);

  // Seed from server response. If user has never initialized AND no windows exist,
  // silently persist defaults.
  useEffect(() => {
    if (isLoading) return;
    if (seededRef.current) return;

    if (windows && windows.length > 0) {
      setDraft(windows);
      seededRef.current = true;
      return;
    }

    // Empty windows — only seed defaults for first-time users.
    if (hasInitialized === false) {
      seededRef.current = true;
      setDraft(DEFAULT_WINDOWS);
      // Silent default-persist; ignore errors (the local draft stays for the user).
      save(DEFAULT_WINDOWS, { hasInitialized: true }).catch(() => {});
    } else {
      // hasInitialized is true and the user has 0 windows — respect that.
      seededRef.current = true;
      setDraft([]);
    }
  }, [isLoading, windows, hasInitialized, save]);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const showToast = (kind, message, ms = 3000) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ kind, message });
    toastTimer.current = setTimeout(() => setToast(null), ms);
  };

  const updateAt = (i, updates) => {
    setDraft((prev) => prev.map((w, idx) => (idx === i ? { ...w, ...updates } : w)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await save(draft, { hasInitialized: true });
      showToast('ok', 'Saved');
    } catch (err) {
      const detail = err?.message ? ` (${err.message})` : '';
      showToast('err', `Couldn't save — try again${detail}`, 5000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PhoneFrame>
      <AppHeader
        left={
          <Link href="/settings" className="ss-iconbtn" aria-label="Back">
            <Icon name="arrowL" size={16} />
          </Link>
        }
        center={<Greeting day="ENERGY MAP" date="When you do your best work" />}
        right={
          <Link href="/settings" className="ss-iconbtn" aria-label="Settings">
            <Icon name="settings" size={16} />
          </Link>
        }
      />

      <div style={{ padding: '0 16px 12px' }}>
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: 'var(--surface-1)',
            border: '1px solid var(--hairline)',
            fontSize: 11,
            color: 'var(--fg-2)',
            lineHeight: 1.45,
          }}
        >
          The AI uses these to{' '}
          <span style={{ color: 'var(--fg)' }}>match tasks to your rhythm</span> — focus
          work in peaks, admin in dips.
        </div>
      </div>

      <div
        className="ss-scroll"
        style={{ flex: 1, padding: '0 16px', minHeight: 0 }}
      >
        {isLoading && draft.length === 0 ? (
          <div
            style={{
              padding: '24px 8px',
              color: 'var(--fg-3)',
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              textAlign: 'center',
            }}
          >
            Loading…
          </div>
        ) : (
          <div className="ss-stack ss-stack-tight">
            {draft.map((w, i) => (
              <EnergyWindowRow
                key={i}
                window={w}
                onChange={(updates) => updateAt(i, updates)}
              />
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '12px 16px 18px', position: 'relative' }}>
        {toast ? (
          <div
            role="status"
            aria-live="polite"
            className="ss-card"
            style={{
              position: 'absolute',
              left: 16,
              right: 16,
              bottom: 72,
              padding: '10px 12px',
              fontSize: 12,
              color: toast.kind === 'err' ? 'var(--prio)' : 'var(--fg)',
              background: 'var(--surface-1)',
              border: `1px solid var(--hairline)`,
              boxShadow: 'var(--shadow-md)',
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {toast.message}
          </div>
        ) : null}
        <Button
          variant="go"
          style={{ width: '100%' }}
          onClick={handleSave}
          disabled={saving}
        >
          <Icon name="check" size={14} stroke={2.4} />{' '}
          {saving ? 'Saving…' : 'Save energy map'}
        </Button>
      </div>
    </PhoneFrame>
  );
}
