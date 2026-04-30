'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PhoneFrame from '../../components/ui/PhoneFrame';
import AppHeader from '../../components/ui/AppHeader';
import Greeting from '../../components/ui/Greeting';
import Icon from '../../components/ui/Icon';
import Segment from '../../components/ui/Segment';
import Button from '../../components/ui/Button';
import { useTheme } from '../../hooks/useTheme';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';

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

          {/* Account */}
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
      </div>
    </PhoneFrame>
  );
}
