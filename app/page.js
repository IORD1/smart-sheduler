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
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path
              fill="#fff"
              d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.3 2.5 30 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6c1.9-5.6 7.1-9.7 13.6-9.7z"
            />
            <path
              fill="#fff"
              d="M46.6 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.7c-.5 2.9-2.2 5.4-4.7 7l7.6 5.9c4.4-4.1 7-10.1 7-17.2z"
            />
            <path
              fill="#fff"
              d="M10.4 28.6C10 27.3 9.8 26 9.8 24.5s.2-2.8.6-4.1l-7.8-6C.9 17.6 0 20.9 0 24.5s.9 6.9 2.6 10.1l7.8-6z"
            />
            <path
              fill="#fff"
              d="M24 49c6 0 11-2 14.7-5.4l-7.6-5.9c-2.1 1.4-4.8 2.3-7.1 2.3-6.5 0-12-4.4-13.9-10.4l-7.8 6C6.5 43.6 14.6 49 24 49z"
            />
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
