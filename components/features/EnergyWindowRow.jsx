'use client';

import { CATEGORIES, CATEGORY_KEYS } from '../../lib/categories';
import { minToShort, hhmmToMin } from '../../lib/time';

const inputBase = {
  background: 'var(--surface-2)',
  border: '1px solid var(--hairline)',
  borderRadius: 8,
  color: 'var(--fg)',
  fontFamily: 'inherit',
  fontSize: 12,
  padding: '6px 8px',
  outline: 'none',
  minWidth: 0,
};

export default function EnergyWindowRow({ window: w, onChange }) {
  const cat = CATEGORIES[w.type] || CATEGORIES.personal;

  const update = (patch) => {
    if (!onChange) return;
    onChange({ ...w, ...patch });
  };

  const setLevel = (n) => update({ level: n });

  const onTimeChange = (key, value) => {
    const min = hhmmToMin(value);
    if (min == null) return;
    update({ [key]: min });
  };

  return (
    <div
      style={{
        padding: '12px 14px',
        background: 'var(--surface-1)',
        border: '1px solid var(--hairline)',
        borderRadius: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <input
            type="text"
            value={w.label || ''}
            onChange={(e) => update({ label: e.target.value })}
            placeholder="Label"
            aria-label="Window label"
            style={{
              ...inputBase,
              fontSize: 13,
              fontWeight: 500,
              background: 'transparent',
              border: '1px solid transparent',
              padding: '4px 6px',
              marginLeft: -6,
            }}
          />
          <div
            style={{
              display: 'flex',
              gap: 6,
              alignItems: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--fg-2)',
            }}
          >
            <input
              type="time"
              value={typeof w.startMin === 'number' ? minToShort(w.startMin) : ''}
              onChange={(e) => onTimeChange('startMin', e.target.value)}
              aria-label="Start time"
              style={{ ...inputBase, fontFamily: 'var(--font-mono)', fontSize: 11, padding: '4px 6px' }}
            />
            <span style={{ color: 'var(--fg-3)' }}>–</span>
            <input
              type="time"
              value={typeof w.endMin === 'number' ? minToShort(w.endMin) : ''}
              onChange={(e) => onTimeChange('endMin', e.target.value)}
              aria-label="End time"
              style={{ ...inputBase, fontFamily: 'var(--font-mono)', fontSize: 11, padding: '4px 6px' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 3, paddingTop: 6, flexShrink: 0 }}>
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`Set level ${n}`}
              onClick={() => setLevel(n)}
              style={{
                width: 6,
                height: 18,
                borderRadius: 3,
                padding: 0,
                border: 'none',
                cursor: 'pointer',
                background: n <= w.level ? `var(--cat-${w.type || 'personal'})` : 'var(--surface-3)',
              }}
            />
          ))}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 6,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <select
          value={w.type || 'personal'}
          onChange={(e) => update({ type: e.target.value })}
          aria-label="Window type"
          style={{
            ...inputBase,
            background: `var(--cat-${w.type || 'personal'}-soft)`,
            color: cat.color,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 500,
            padding: '4px 8px',
            borderRadius: 999,
          }}
        >
          {CATEGORY_KEYS.map((key) => (
            <option key={key} value={key} style={{ background: 'var(--surface-1)', color: 'var(--fg)' }}>
              {CATEGORIES[key].label}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={w.note || ''}
          onChange={(e) => update({ note: e.target.value })}
          placeholder="Note"
          aria-label="Window note"
          style={{
            ...inputBase,
            flex: 1,
            minWidth: 80,
            fontSize: 11,
            color: 'var(--fg-2)',
            background: 'transparent',
            border: '1px solid transparent',
            padding: '4px 6px',
          }}
        />
      </div>
    </div>
  );
}
