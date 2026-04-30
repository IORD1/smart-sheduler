import { Fragment } from 'react';
import EventRow from './EventRow';
import { tToMin, formatDuration } from '../../lib/time';
import { computeScheduleGaps } from '../../lib/scheduleGaps';

function GapRow({ durMin }) {
  return (
    <div
      style={{
        border: '1px dashed var(--hairline-strong)',
        borderRadius: 10,
        padding: '8px 12px',
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

export default function ScheduleListView({ events = [], onEventClick }) {
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
  // Pair each gap with the index of the event it follows in `sorted`.
  // computeScheduleGaps walks sorted pairwise, so gap[i] follows sorted[i]
  // when each (i, i+1) gap meets the threshold — but skipped pairs break that
  // mapping. Resolve by matching on the gap's startMin against each event's
  // endMin in order.
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
    <div className="ss-scroll" style={{ flex: 1, padding: '0 16px', minHeight: 0 }}>
      <div className="ss-stack ss-stack-tight">
        {sorted.map((ev, i) => {
          const gap = gapByIndex.get(i);
          return (
            <Fragment key={ev.id}>
              <EventRow
                ev={ev}
                onClick={onEventClick && ev.htmlLink ? onEventClick : undefined}
              />
              {gap ? <GapRow durMin={gap.durMin} /> : null}
            </Fragment>
          );
        })}
      </div>
      <div style={{ height: 16 }} />
    </div>
  );
}
