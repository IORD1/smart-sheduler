'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PhoneFrame from '../../components/ui/PhoneFrame';
import AppHeader from '../../components/ui/AppHeader';
import Greeting from '../../components/ui/Greeting';
import Icon from '../../components/ui/Icon';
import Segment from '../../components/ui/Segment';
import Button from '../../components/ui/Button';
import { RowSkel, SkelStack } from '../../components/ui/Skeletons';
import { useTheme } from '../../hooks/useTheme';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { listCalendars } from '../../services/googleCalendar';
import { apiFetch } from '../../lib/userId';

const THEME_OPTIONS = [
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'light', label: 'Light', icon: 'sun' },
];

const ACCENT_OPTIONS = [
  { value: 'lime', label: 'Lime' },
  { value: 'sky', label: 'Sky' },
  { value: 'rose', label: 'Rose' },
  { value: 'amber', label: 'Amber' },
];

export default function SettingsPage() {
  const router = useRouter();
  const { theme, accent, setTheme, setAccent } = useTheme();
  const { signOut, email, ready, token } = useGoogleAuth();
  const [calendars, setCalendars] = useState(null); // null=loading, []=loaded
  const [selectedIds, setSelectedIds] = useState([]);
  const [calError, setCalError] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    if (!ready || !token) return;
    let cancelled = false;
    (async () => {
      try {
        const [cals, prefs] = await Promise.all([
          listCalendars(),
          apiFetch('/api/preferences').catch(() => ({})),
        ]);
        if (cancelled) return;
        setCalendars(cals || []);
        setSelectedIds(
          Array.isArray(prefs?.selectedCalendarIds) ? prefs.selectedCalendarIds : []
        );
      } catch (err) {
        if (!cancelled) {
          setCalendars([]);
          setCalError(err?.message || 'Could not load calendars');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, token]);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const showToast = (msg, ms = 3000) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), ms);
  };

  const toggleCalendar = async (id, checked) => {
    const prev = selectedIds;
    const next = checked
      ? Array.from(new Set([...prev, id]))
      : prev.filter((x) => x !== id);
    setSelectedIds(next);
    try {
      await apiFetch('/api/preferences', {
        method: 'PUT',
        body: JSON.stringify({ selectedCalendarIds: next }),
      });
    } catch (err) {
      setSelectedIds(prev);
      showToast(`Couldn't save — ${err?.message || 'try again'}`, 4000);
    }
  };

  const handleSignOut = () => {
    try {
      signOut();
    } catch (err) {
      console.error('signOut failed', err);
    }
    router.push('/');
  };

  return (
    <PhoneFrame>
      <AppHeader
        left={
          <Link href="/schedule" className="ss-iconbtn" aria-label="Back">
            <Icon name="arrowL" size={16} />
          </Link>
        }
        center={<Greeting day="SETTINGS" date="Personalize your scheduler" />}
        right={<span />}
      />

      <div
        className="ss-scroll"
        style={{ flex: 1, padding: '0 16px 18px', minHeight: 0 }}
      >
        <div className="ss-stack ss-stack-loose">
          {/* Theme card */}
          <div className="ss-card">
            <div
              style={{
                fontSize: 11,
                color: 'var(--fg-3)',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: 0.06,
                marginBottom: 10,
              }}
            >
              Theme
            </div>
            <div style={{ marginBottom: 12 }}>
              <Segment
                value={theme}
                onChange={setTheme}
                options={THEME_OPTIONS}
              />
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--fg-3)',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: 0.06,
                marginBottom: 10,
              }}
            >
              Accent
            </div>
            <Segment
              value={accent}
              onChange={setAccent}
              options={ACCENT_OPTIONS}
            />
          </div>

          {/* More */}
          <div className="ss-card">
            <div
              style={{
                fontSize: 11,
                color: 'var(--fg-3)',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: 0.06,
                marginBottom: 10,
              }}
            >
              More
            </div>
            <div className="ss-stack ss-stack-tight">
              <Link
                href="/energy"
                className="ss-row"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <Icon name="bolt" size={16} color="var(--fg-2)" />
                <div className="row-body">
                  <div className="row-title">Energy Map</div>
                  <div className="row-meta">
                    <span>When you do your best work</span>
                  </div>
                </div>
                <Icon name="arrow" size={14} color="var(--fg-3)" />
              </Link>
              <Link
                href="/suggestions"
                className="ss-row"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <Icon name="sparkles" size={16} color="var(--fg-2)" />
                <div className="row-body">
                  <div className="row-title">Smart Suggestions</div>
                  <div className="row-meta">
                    <span>AI ideas for your day</span>
                  </div>
                </div>
                <Icon name="arrow" size={14} color="var(--fg-3)" />
              </Link>
            </div>
          </div>

          {/* Calendars */}
          {ready && token ? (
            <div className="ss-card">
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--fg-3)',
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.06,
                  marginBottom: 4,
                }}
              >
                Calendars
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--fg-2)',
                  lineHeight: 1.45,
                  marginBottom: 10,
                }}
              >
                Pick which calendars feed into your schedule and the AI plan.
              </div>
              {calendars === null ? (
                <SkelStack component={RowSkel} count={3} />
              ) : calendars.length === 0 ? (
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--fg-3)',
                    padding: '8px 4px',
                  }}
                >
                  {calError || 'No calendars found.'}
                </div>
              ) : (
                <div className="ss-stack ss-stack-tight">
                  {calendars.map((c) => {
                    const checked = c.primary || selectedIds.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className="ss-row"
                        style={{
                          cursor: c.primary ? 'default' : 'pointer',
                          padding: '8px 10px',
                          gap: 10,
                        }}
                      >
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 3,
                            background: c.backgroundColor || 'var(--surface-3)',
                            flexShrink: 0,
                          }}
                        />
                        <div className="row-body">
                          <div
                            className="row-title"
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={c.summary}
                          >
                            {c.summary}
                          </div>
                          {c.primary ? (
                            <div className="row-meta">
                              <span>Always included</span>
                            </div>
                          ) : null}
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={c.primary}
                          onChange={(e) =>
                            !c.primary && toggleCalendar(c.id, e.target.checked)
                          }
                          aria-label={`Include ${c.summary}`}
                          style={{
                            width: 16,
                            height: 16,
                            accentColor: 'var(--go)',
                            cursor: c.primary ? 'default' : 'pointer',
                          }}
                        />
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          {/* Account */}
          <div className="ss-card" style={{ position: 'relative' }}>
            <div
              style={{
                fontSize: 11,
                color: 'var(--fg-3)',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: 0.06,
                marginBottom: 10,
              }}
            >
              Account
            </div>
            {ready && token ? (
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--fg)',
                  marginBottom: 12,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={email || 'Signed in'}
              >
                {email || 'Signed in'}
              </div>
            ) : null}
            <Button
              variant="ghost"
              style={{ width: '100%' }}
              onClick={handleSignOut}
            >
              Sign out
            </Button>
          </div>
        </div>
        {toast ? (
          <div
            role="status"
            aria-live="polite"
            className="ss-card"
            style={{
              position: 'fixed',
              left: '50%',
              transform: 'translateX(-50%)',
              bottom: 32,
              padding: '10px 14px',
              fontSize: 12,
              color: 'var(--prio)',
              background: 'var(--surface-1)',
              border: '1px solid var(--hairline)',
              boxShadow: 'var(--shadow-md)',
              fontFamily: 'var(--font-mono)',
              zIndex: 5,
              maxWidth: 320,
            }}
          >
            {toast}
          </div>
        ) : null}
      </div>
    </PhoneFrame>
  );
}
