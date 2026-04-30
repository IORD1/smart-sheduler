import { Fragment } from 'react';
import Icon from '../ui/Icon';
import { tToMin, durMin, minToShort, formatDuration } from '../../lib/time';
import { computeScheduleGaps } from '../../lib/scheduleGaps';

export default function ScheduleTimelineView({
  events = [],
  dayStart = 8 * 60,
  dayEnd = 22 * 60,
  scale = 1.4,
  onEventClick,
}) {
  const totalMin = dayEnd - dayStart;
  const totalH = Math.ceil(totalMin / 60);
  const px = (m) => m * scale;

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

  // Build gaps for "free" labels (includes leading/trailing edges so the
  // timeline grid doesn't have unlabelled blank chunks).
  const gaps = computeScheduleGaps(events, {
    includeEdges: true,
    dayStart,
    dayEnd,
  });

  return (
    <div className="ss-scroll" style={{ flex: 1, minHeight: 0, padding: '0 16px' }}>
      <div style={{ position: 'relative', height: px(totalMin), marginLeft: 40 }}>
        {/* hour grid */}
        {Array.from({ length: totalH + 1 }).map((_, i) => {
          const m = dayStart + i * 60;
          if (m > dayEnd) return null;
          const top = px(m - dayStart);
          const h = Math.floor(m / 60);
          const ampm = h >= 12 ? 'pm' : 'am';
          const h12 = ((h + 11) % 12) + 1;
          return (
            <Fragment key={i}>
              <div
                style={{
                  position: 'absolute',
                  left: -36,
                  top: top - 6,
                  fontSize: 10,
                  color: 'var(--fg-3)',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: -0.02,
                }}
              >
                {h12}
                {ampm}
              </div>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top,
                  height: 1,
                  background: 'var(--hairline)',
                }}
              />
            </Fragment>
          );
        })}

        {/* gaps */}
        {gaps.map((g, i) => {
          const top = px(g.startMin - dayStart);
          const h = px(g.durMin);
          return (
            <div
              key={`g${i}`}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: top + 2,
                height: Math.max(h - 4, 22),
                borderRadius: 10,
                border: '1px dashed var(--hairline-strong)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: 'var(--fg-2)',
                fontFamily: 'var(--font-mono)',
                letterSpacing: 0.04,
                textTransform: 'uppercase',
              }}
            >
              free · {formatDuration(g.durMin)}
            </div>
          );
        })}

        {/* events */}
        {events.map((ev) => {
          const top = px(tToMin(ev.start) - dayStart);
          const h = px(durMin(ev.start, ev.end));
          const colorVar = `var(--cat-${ev.category})`;
          const softVar = `var(--cat-${ev.category}-soft)`;
          const clickable = !!onEventClick && !!ev.htmlLink;
          return (
            <div
              key={ev.id}
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
                position: 'absolute',
                left: 0,
                right: 0,
                top: top + 2,
                height: Math.max(h - 4, 22),
                background: softVar,
                borderLeft: `3px solid ${colorVar}`,
                borderRadius: 10,
                padding: '6px 10px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: h > 60 ? 'flex-start' : 'center',
                gap: 2,
                overflow: 'hidden',
                cursor: clickable ? 'pointer' : undefined,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--fg)',
                  letterSpacing: -0.01,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {ev.priority ? <span style={{ color: 'var(--prio)' }}>!</span> : null}
                {ev.title}
                {ev.new ? (
                  <span
                    style={{
                      fontSize: 9,
                      padding: '1px 5px',
                      background: 'var(--go)',
                      color: 'var(--go-fg)',
                      borderRadius: 3,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                    }}
                  >
                    NEW
                  </span>
                ) : null}
                {ev.locked ? <Icon name="pin" size={10} color="var(--fg-3)" /> : null}
              </div>
              {h > 40 ? (
                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--fg-2)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {minToShort(tToMin(ev.start))}–{minToShort(tToMin(ev.end))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
