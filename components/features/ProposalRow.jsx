'use client';

import { CATEGORIES } from '../../lib/categories';
import { tToMin, minToShort, durMin, formatDuration } from '../../lib/time';
import Chip from '../ui/Chip';
import Icon from '../ui/Icon';

export default function ProposalRow({ ev, dragHandleProps }) {
  const cat = CATEGORIES[ev.category];
  return (
    <div
      className="ss-row"
      style={{
        padding: '10px 12px',
        opacity: ev.locked ? 0.7 : 1,
        background: ev.new ? 'var(--surface-1)' : 'var(--surface-0)',
        borderColor: ev.new ? 'var(--hairline-strong)' : 'var(--hairline)',
      }}
    >
      <div
        style={{
          width: 48,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--fg-2)',
          textAlign: 'right',
          flexShrink: 0,
          lineHeight: 1.3,
        }}
      >
        <div>{minToShort(tToMin(ev.start))}</div>
        <div style={{ color: 'var(--fg-3)' }}>{minToShort(tToMin(ev.end))}</div>
      </div>
      <span
        className="row-cat"
        style={{ background: cat?.color, height: 32 }}
      />
      <div className="row-body">
        <div
          className="row-title"
          style={{
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {ev.priority ? <span style={{ color: 'var(--prio)' }}>!</span> : null}
          {ev.title}
          {ev.new ? (
            <Chip kind="go" style={{ fontSize: 9, padding: '2px 6px' }}>
              NEW
            </Chip>
          ) : null}
        </div>
        <div className="row-meta" style={{ fontSize: 10 }}>
          {cat ? <span style={{ color: cat.color }}>#{ev.category}</span> : null}
          <span>· {formatDuration(durMin(ev.start, ev.end))}</span>
        </div>
      </div>
      {ev.locked ? (
        <Icon name="pin" size={12} color="var(--fg-3)" />
      ) : (
        <button
          type="button"
          className="ss-iconbtn"
          {...(dragHandleProps || {})}
          style={{
            width: 22,
            height: 28,
            borderRadius: 6,
            cursor: 'grab',
            touchAction: 'none',
            background: 'transparent',
            border: 'none',
          }}
          aria-label="Drag to reorder"
        >
          <Icon name="grip" size={14} color="var(--fg-3)" />
        </button>
      )}
    </div>
  );
}
