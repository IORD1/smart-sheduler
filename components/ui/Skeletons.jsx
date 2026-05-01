'use client';

import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';

const BASE = 'var(--surface-2)';
const HIGHLIGHT = 'var(--surface-3)';

function Theme({ children }) {
  return (
    <SkeletonTheme baseColor={BASE} highlightColor={HIGHLIGHT}>
      {children}
    </SkeletonTheme>
  );
}

// Generic list row matching the .ss-row layout used by EventRow / TodoRow.
export function RowSkel() {
  return (
    <Theme>
      <div className="ss-row" style={{ padding: '10px 12px' }}>
        <span className="row-cat" style={{ background: 'var(--surface-3)' }} />
        <div className="row-body">
          <div className="row-title">
            <Skeleton width="55%" height={13} />
          </div>
          <div className="row-meta">
            <Skeleton width="40%" height={10} />
          </div>
        </div>
      </div>
    </Theme>
  );
}

// Variant with a left-side time column, used on /preview proposal rows.
export function ProposalRowSkel() {
  return (
    <Theme>
      <div className="ss-row" style={{ padding: '10px 12px' }}>
        <div
          style={{
            width: 48,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            alignItems: 'flex-end',
          }}
        >
          <Skeleton width={32} height={10} />
          <Skeleton width={32} height={10} />
        </div>
        <span
          className="row-cat"
          style={{ background: 'var(--surface-3)', height: 32 }}
        />
        <div className="row-body">
          <div className="row-title">
            <Skeleton width="60%" height={13} />
          </div>
          <div className="row-meta">
            <Skeleton width="35%" height={10} />
          </div>
        </div>
      </div>
    </Theme>
  );
}

export function AISummarySkel() {
  return (
    <Theme>
      <div
        style={{
          margin: '0 16px 14px',
          padding: '12px 14px',
          background:
            'linear-gradient(135deg, var(--go-glow), transparent 70%), var(--surface-1)',
          border: '1px solid var(--hairline)',
          borderRadius: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
          }}
        >
          <Skeleton width={22} height={22} borderRadius={6} />
          <Skeleton width="60%" height={12} />
        </div>
        <Skeleton count={2} height={11} />
      </div>
    </Theme>
  );
}

export function SuggestionCardSkel() {
  return (
    <Theme>
      <div
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--hairline)',
          borderRadius: 16,
          padding: 14,
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Skeleton width={36} height={36} borderRadius={10} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Skeleton width="70%" height={13} />
            <div style={{ marginTop: 4 }}>
              <Skeleton width="90%" height={11} />
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 10,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 6,
          }}
        >
          <Skeleton width={70} height={28} borderRadius={10} />
          <Skeleton width={90} height={28} borderRadius={10} />
        </div>
      </div>
    </Theme>
  );
}

export function EnergyWindowSkel() {
  return (
    <Theme>
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <Skeleton width="50%" height={14} />
            <div style={{ marginTop: 6 }}>
              <Skeleton width={100} height={11} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 3, paddingTop: 6, flexShrink: 0 }}>
            <Skeleton width={6} height={18} borderRadius={3} />
            <Skeleton width={6} height={18} borderRadius={3} />
            <Skeleton width={6} height={18} borderRadius={3} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Skeleton width={70} height={20} borderRadius={999} />
          <div style={{ flex: 1 }}>
            <Skeleton height={14} />
          </div>
        </div>
      </div>
    </Theme>
  );
}

export function SkelStack({ component: Comp, count = 3 }) {
  return (
    <div className="ss-stack ss-stack-tight">
      {Array.from({ length: count }).map((_, i) => (
        <Comp key={i} />
      ))}
    </div>
  );
}
