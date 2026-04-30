'use client';

import { parseTodo } from '../../lib/parseTodo';

const TEMPLATES = [
  { label: 'Lunch', text: 'Lunch @45m #meal' },
  { label: 'Gym', text: 'Gym session @1h #health' },
  { label: 'Focus', text: 'Deep work @90m #focus !' },
  { label: 'Coffee', text: 'Coffee break @15m #personal' },
  { label: 'Errand', text: 'Run errand @30m #errand' },
  { label: 'Call', text: 'Catch-up call @30m #social' },
];

export default function QuickAdd({ onPick, onAdd }) {
  const handleClick = (text) => {
    if (onAdd) {
      onAdd(parseTodo(text));
    } else if (onPick) {
      onPick(text);
    }
  };
  return (
    <div
      className="ss-scroll"
      style={{
        padding: '0 16px 12px',
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        flexShrink: 0,
      }}
    >
      {TEMPLATES.map((t) => (
        <button
          key={t.label}
          type="button"
          onClick={() => handleClick(t.text)}
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--hairline)',
            color: 'var(--fg-1)',
            padding: '7px 12px',
            borderRadius: '999px',
            fontSize: '12px',
            fontFamily: 'inherit',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          + {t.label}
        </button>
      ))}
    </div>
  );
}
