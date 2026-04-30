'use client';

import { useEffect, useState } from 'react';

// Format a Date as "h:mm" with no leading zero on the hour and no AM/PM,
// matching the iOS-style aesthetic. 0 maps to 12 (12:00 AM display).
function formatTime(d) {
  let h = d.getHours() % 12;
  if (h === 0) h = 12;
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// `time` prop intentionally ignored: callers (notably PhoneFrame) pass the
// hard-coded default '9:41' for legacy reasons. We always render the real
// current time, updated each minute. Render empty string until after mount
// to avoid SSR/CSR hydration mismatches.
export default function StatusBar() {
  const [now, setNow] = useState('');

  useEffect(() => {
    setNow(formatTime(new Date()));
    // Align the next tick to the start of the next minute so we don't drift.
    const msUntilNextMinute = 60000 - (Date.now() % 60000);
    let interval;
    const align = setTimeout(() => {
      setNow(formatTime(new Date()));
      interval = setInterval(() => {
        setNow(formatTime(new Date()));
      }, 60000);
    }, msUntilNextMinute);
    return () => {
      clearTimeout(align);
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <div className="ss-statusbar">
      <span>{now}</span>
      <div className="ss-sb-icons">
        <svg width="16" height="10" viewBox="0 0 18 12" fill="currentColor">
          <rect x="0" y="8" width="3" height="4" rx="0.5"/>
          <rect x="5" y="5" width="3" height="7" rx="0.5"/>
          <rect x="10" y="2" width="3" height="10" rx="0.5"/>
          <rect x="15" y="0" width="3" height="12" rx="0.5"/>
        </svg>
        <svg width="22" height="11" viewBox="0 0 24 12" fill="none">
          <rect x="0.5" y="0.5" width="21" height="11" rx="2.5" stroke="currentColor" opacity="0.4"/>
          <rect x="2" y="2" width="16" height="8" rx="1.2" fill="currentColor"/>
          <rect x="22.5" y="4" width="1.5" height="4" rx="0.5" fill="currentColor" opacity="0.4"/>
        </svg>
      </div>
    </div>
  );
}
