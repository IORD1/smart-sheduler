import { Fragment } from 'react';
import Chip from '../ui/Chip';
import { CATEGORIES } from '../../lib/categories';
import { tToMin, durMin, minToShort, formatDuration } from '../../lib/time';
import { computeScheduleGaps } from '../../lib/scheduleGaps';

function GapRow({ durMin }) {
  return (
    <div
      style={{
        border: '1px dashed var(--hairline-strong)',
        borderRadius: 10,
        padding: '7px 10px',
        textAlign: 'center',
        fontSize: 10,
        color: 'var(--fg-2)',
        fontFamily: 'var(--font-mono)',
        letterSpacing: 0.04,
        textTransform: 'uppercase',
      }}
    >
      free · {formatDuration(durMin)}
    </div>
  );
}

export default function ScheduleHybridView({
  events = [],
  dayStart = 8 * 60,
  dayEnd = 22 * 60,
  onEventClick,
}) {
  const totalMin = dayEnd - dayStart;
  const px = (m) => m * 0.5;

  if (events.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          minHeight: 0,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          className="ss-card"
          style={{
            textAlign: 'center',
            color: 'var(--fg-2)',
            fontSize: 12,
            lineHeight: 1.55,
            maxWidth: 260,
          }}
        >
          Nothing scheduled yet. Tap + to add a task or the sparkles icon to
          plan with AI.
        </div>
      </div>
    );
  }

  const sorted = [...events].sort(
    (a, b) => tToMin(a.start) - tToMin(b.start)
  );
  const gaps = computeScheduleGaps(sorted);
  // Pair each gap with the sorted-event index it follows.
  const gapByIndex = new Map();
  let gIdx = 0;
  for (let i = 0; i < sorted.length - 1 && gIdx < gaps.length; i++) {
    if (tToMin(sorted[i].end) === gaps[gIdx].startMin
        && tToMin(sorted[i + 1].start) === gaps[gIdx].endMin) {
      gapByIndex.set(i, gaps[gIdx]);
      gIdx++;
    }
  }

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        padding: '0 16px',
        display: 'flex',
        gap: 10,
        overflow: 'hidden',
      }}
    >
      {/* mini timeline */}
      <div
        style={{
          width: 40,
          position: 'relative',
          height: px(totalMin),
          flexShrink: 0,
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => {
          const top = px(i * 120);
          const m = dayStart + i * 120;
          const h = Math.floor(m / 60);
          const ampm = h >= 12 ? 'pm' : 'am';
          const h12 = ((h + 11) % 12) + 1;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                top,
                fontSize: 9,
                color: 'var(--fg-3)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {h12}
              {ampm}
            </div>
          );
        })}
        <div
          style={{
            position: 'absolute',
            left: 28,
            top: 0,
            bottom: 0,
            width: 4,
            borderRadius: 4,
            background: 'var(--surface-2)',
          }}
        />
        {events.map((ev) => {
          const top = px(tToMin(ev.start) - dayStart);
          const h = px(durMin(ev.start, ev.end));
          return (
            <div
              key={ev.id}
              style={{
                position: 'absolute',
                left: 28,
                top,
                width: 4,
                height: Math.max(h, 4),
                borderRadius: 4,
                background: `var(--cat-${ev.category})`,
              }}
            />
          );
        })}
      </div>

      {/* list */}
      <div className="ss-scroll" style={{ flex: 1, minWidth: 0 }}>
        <div className="ss-stack ss-stack-tight">
          {sorted.map((ev, i) => {
            const cat = CATEGORIES[ev.category];
            const clickable = !!onEventClick && !!ev.htmlLink;
            const gap = gapByIndex.get(i);
            return (
              <Fragment key={ev.id}>
                <div
                  className="ss-row"
                  role={clickable ? 'button' : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  onClick={clickable ? () => onEventClick(ev) : undefined}
                  onKeyDown={
                    clickable
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onEventClick(ev);
                          }
                        }
                      : undefined
                  }
                  style={{
                    padding: '9px 11px',
                    cursor: clickable ? 'pointer' : undefined,
                  }}
                >
                  <div className="row-body">
                    <div className="row-title" style={{ fontSize: 13 }}>
                      {ev.priority ? <span style={{ color: 'var(--prio)' }}>!</span> : null}
                      {ev.title}
                    </div>
                    <div className="row-meta" style={{ fontSize: 10 }}>
                      <span style={{ color: cat?.color }}>#{ev.category}</span>
                      <span>
                        · {minToShort(tToMin(ev.start))}–{minToShort(tToMin(ev.end))}
                      </span>
                    </div>
                  </div>
                  {ev.new ? <Chip kind="go">NEW</Chip> : null}
                </div>
                {gap ? <GapRow durMin={gap.durMin} /> : null}
              </Fragment>
            );
          })}
        </div>
        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}
