'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PhoneFrame from '../components/ui/PhoneFrame';
import Chip from '../components/ui/Chip';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import { useGoogleAuth } from '../hooks/useGoogleAuth';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useGoogleAuth();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleContinue = async () => {
    setError(null);
    setBusy(true);
    try {
      await signIn();
      router.push('/schedule');
    } catch (err) {
      setError(err?.message || 'Sign-in failed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PhoneFrame>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 24px 28px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Chip kind="duration" style={{ fontSize: 10 }}>
            v 2.0 · beta
          </Chip>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            marginTop: 20,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 22,
              background:
                'linear-gradient(135deg, var(--go), color-mix(in oklab, var(--go) 60%, var(--cat-health)))',
              display: 'grid',
              placeItems: 'center',
              marginBottom: 24,
              boxShadow: '0 10px 40px var(--go-glow)',
            }}
          >
            <Icon name="sparkles" size={36} stroke={2.2} color="var(--go-fg)" />
          </div>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 700,
              margin: 0,
              letterSpacing: -0.03,
              lineHeight: 1.05,
              color: 'var(--fg)',
            }}
          >
            Brain&nbsp;dump.
            <br />
            <span style={{ color: 'var(--go)' }}>AI plans</span> the day.
          </h1>
          <p
            style={{
              marginTop: 16,
              fontSize: 14,
              color: 'var(--fg-2)',
              lineHeight: 1.5,
              maxWidth: 280,
            }}
          >
            Type tasks how you talk —{' '}
            <span className="mono" style={{ color: 'var(--fg-1)' }}>
              tennis @1h
            </span>
            ,{' '}
            <span className="mono" style={{ color: 'var(--fg-1)' }}>
              lunch @30m
            </span>{' '}
            — we fit them around your calendar.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginBottom: 20,
          }}
        >
          <Chip kind="focus" icon="sparkles">
            Gemini AI
          </Chip>
          <Chip kind="work" icon="calendar">
            Google Calendar
          </Chip>
          <Chip kind="health" icon="lightning">
            Energy-aware
          </Chip>
        </div>

        <Button
          variant="go"
          onClick={handleContinue}
          disabled={busy}
          style={{ width: '100%', padding: 14, fontWeight: 600 }}
        >
          <svg width="18" height="18" viewBox="0 0 50 50" fill="currentColor">
            <path d="M 25.996094 48 C 13.3125 48 2.992188 37.683594 2.992188 25 C 2.992188 12.316406 13.3125 2 25.996094 2 C 31.742188 2 37.242188 4.128906 41.488281 7.996094 L 42.261719 8.703125 L 34.675781 16.289063 L 33.972656 15.6875 C 31.746094 13.78125 28.914063 12.730469 25.996094 12.730469 C 19.230469 12.730469 13.722656 18.234375 13.722656 25 C 13.722656 31.765625 19.230469 37.269531 25.996094 37.269531 C 30.875 37.269531 34.730469 34.777344 36.546875 30.53125 L 24.996094 30.53125 L 24.996094 20.175781 L 47.546875 20.207031 L 47.714844 21 C 48.890625 26.582031 47.949219 34.792969 43.183594 40.667969 C 39.238281 45.53125 33.457031 48 25.996094 48 Z" />
          </svg>
          {busy ? 'Connecting…' : 'Continue with Google'}
        </Button>

        {error ? (
          <p
            style={{
              fontSize: 11,
              color: 'var(--prio, #ff6b6b)',
              marginTop: 10,
              textAlign: 'center',
              lineHeight: 1.4,
            }}
          >
            {error}
          </p>
        ) : null}

        <p
          style={{
            fontSize: 10,
            color: 'var(--fg-3)',
            marginTop: 12,
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          We only ask for calendar access. Tasks sync to your account so you can pick up where you left off.
        </p>
      </div>
    </PhoneFrame>
  );
}
