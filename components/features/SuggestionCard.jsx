'use client';

import Icon from '../ui/Icon';
import { CATEGORIES } from '../../lib/categories';

export default function SuggestionCard({ suggestion, onDismiss, onAct, showAct = true }) {
  const cat = CATEGORIES[suggestion.category] || CATEGORIES.personal;
  const canAct = showAct && Boolean(suggestion.action);
  return (
    <div
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--hairline)',
        borderRadius: 16,
        padding: 14,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(120% 80% at 0% 0%, var(--cat-${suggestion.category}-soft), transparent 60%)`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'relative',
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `var(--cat-${suggestion.category}-soft)`,
            color: cat.color,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <Icon name={suggestion.icon} size={16} stroke={2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>
            {suggestion.title}
          </div>
          <div style={{ fontSize: 11, color: 'var(--fg-2)', marginTop: 2 }}>
            {suggestion.subtitle}
          </div>
        </div>
      </div>
      <div
        style={{
          position: 'relative',
          marginTop: 10,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 6,
        }}
      >
        <button
          type="button"
          className="ss-btn ghost"
          style={{ padding: '7px 12px', fontSize: 12, borderRadius: 10 }}
          onClick={() => onDismiss?.(suggestion)}
        >
          Dismiss
        </button>
        {canAct ? (
          <button
            type="button"
            className="ss-btn"
            style={{
              padding: '7px 12px',
              fontSize: 12,
              borderRadius: 10,
              background: cat.color,
              color: 'var(--bg)',
              fontWeight: 600,
            }}
            onClick={() => onAct?.(suggestion)}
          >
            {suggestion.action}
          </button>
        ) : null}
      </div>
    </div>
  );
}
