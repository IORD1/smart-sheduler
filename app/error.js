'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import PhoneFrame from '../components/ui/PhoneFrame';
import AppHeader from '../components/ui/AppHeader';
import Greeting from '../components/ui/Greeting';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';

// App Router auto-detects this as the global error boundary. It must be a
// client component and accepts `error` plus a `reset` function that clears
// the error and re-renders the segment.
export default function Error({ error, reset }) {
  useEffect(() => {
    // Surface to the console so users can copy/paste when reporting.
    // eslint-disable-next-line no-console
    console.error('App error boundary caught:', error);
  }, [error]);

  const message = error?.message || 'Something went wrong.';

  return (
    <PhoneFrame>
      <AppHeader
        left={<span style={{ width: 28 }} />}
        center={<Greeting day="ERROR" date="Something broke" />}
        right={<span style={{ width: 28 }} />}
      />
      <div
        style={{
          flex: 1,
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          overflowY: 'auto',
        }}
        className="ss-scroll"
      >
        <div
          role="alert"
          className="ss-card"
          style={{
            padding: '12px 14px',
            borderRadius: 12,
            background: 'var(--surface-1)',
            border: '1px solid var(--hairline)',
            color: 'var(--fg-1)',
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            lineHeight: 1.5,
            wordBreak: 'break-word',
          }}
        >
          {message}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button
            variant="go"
            onClick={() => reset()}
            style={{ width: '100%', padding: 14 }}
          >
            <Icon name="repeat" size={16} stroke={2} />
            Try again
          </Button>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Button variant="ghost" style={{ width: '100%', padding: 14 }}>
              Go home
            </Button>
          </Link>
        </div>
      </div>
    </PhoneFrame>
  );
}
