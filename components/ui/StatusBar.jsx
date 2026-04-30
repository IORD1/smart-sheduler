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
    </div>
  );
}
