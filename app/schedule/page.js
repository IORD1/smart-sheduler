'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PhoneFrame from '../../components/ui/PhoneFrame';
import AppHeader from '../../components/ui/AppHeader';
import Greeting from '../../components/ui/Greeting';
import Segment from '../../components/ui/Segment';
import Icon from '../../components/ui/Icon';
import ScheduleListView from '../../components/features/ScheduleListView';
import ScheduleTimelineView from '../../components/features/ScheduleTimelineView';
import ScheduleHybridView from '../../components/features/ScheduleHybridView';
import { RowSkel, SkelStack } from '../../components/ui/Skeletons';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { listEventsTodayFromCalendars } from '../../services/googleCalendar';
import { dateToHHMM } from '../../lib/time';
import { classify } from '../../lib/categories';
import { apiFetch } from '../../lib/userId';

const VIEW_OPTIONS = [
  { v: 'list', i: 'list' },
  { v: 'timeline', i: 'clock' },
  { v: 'hybrid', i: 'layers' },
];

const VIEW_INDEX = { list: 0, timeline: 1, hybrid: 2 };

function computeTodayLabels() {
  const now = new Date();
  const day = now
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toUpperCase();
  const date = now.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
  return { day, date };
}

function toViewEvent(raw) {
  if (!raw?.start?.dateTime || !raw?.end?.dateTime) return null;
  const fallback = raw.sourceIsPrimary === false ? 'Work Busy' : '(no title)';
  const title = raw.summary || fallback;
  return {
    id: raw.id,
    title,
    start: dateToHHMM(raw.start.dateTime),
    end: dateToHHMM(raw.end.dateTime),
    category: classify(title),
    locked: true,
    priority: false,
    htmlLink: raw.htmlLink || null,
  };
}

// All-day events have a `start.date` but no `start.dateTime`.
function isAllDay(raw) {
  return !!(raw?.start?.date && !raw?.start?.dateTime);
}

function toAllDayEvent(raw) {
  return {
    id: raw.id,
    title: raw.summary || '(no title)',
    htmlLink: raw.htmlLink || null,
  };
}

export default function SchedulePage() {
  const router = useRouter();
  const { ready, token } = useGoogleAuth();
  const [view, setView] = useState('list');
  const [events, setEvents] = useState([]);
  const [allDayEvents, setAllDayEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayLabels, setTodayLabels] = useState(null);

  useEffect(() => {
    setTodayLabels(computeTodayLabels());
  }, []);

  const carouselRef = useRef(null);
  const slideRefs = useRef([null, null, null]);
  const hasLoadedRef = useRef(false);
  const putTimerRef = useRef(null);

  // Load preferences (saved view + selected calendars) and events together,
  // so we know which calendars to fetch before hitting the GCal API.
  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.push('/');
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      let calendarIds = ['primary'];
      let initialView = 'list';
      try {
        const data = await apiFetch('/api/preferences');
        if (data && typeof data === 'object') {
          if (data.scheduleView && VIEW_INDEX[data.scheduleView] !== undefined) {
            initialView = data.scheduleView;
          }
          if (Array.isArray(data.selectedCalendarIds)) {
            calendarIds = ['primary', ...data.selectedCalendarIds];
          }
        }
      } catch {
        // fall back to defaults
      }
      if (cancelled) return;

      setView(initialView);
      requestAnimationFrame(() => {
        const idx = VIEW_INDEX[initialView] ?? 0;
        const slide = slideRefs.current[idx];
        const root = carouselRef.current;
        if (slide && root) {
          root.scrollLeft = slide.offsetLeft;
        }
        requestAnimationFrame(() => {
          hasLoadedRef.current = true;
        });
      });

      try {
        const items = await listEventsTodayFromCalendars(calendarIds);
        if (cancelled) return;
        const allDay = items.filter(isAllDay).map(toAllDayEvent);
        const mapped = items
          .filter((it) => !isAllDay(it))
          .map(toViewEvent)
          .filter(Boolean);
        setEvents(mapped);
        setAllDayEvents(allDay);
      } catch (err) {
        console.error('failed to list events', err);
        if (!cancelled) {
          setEvents([]);
          setAllDayEvents([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, token, router]);

  // IntersectionObserver — tracks which slide is most visible.
  useEffect(() => {
    const root = carouselRef.current;
    if (!root) return;
    const slides = slideRefs.current.filter(Boolean);
    if (slides.length === 0) return;

    const visibility = new Map();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibility.set(entry.target, entry.intersectionRatio);
        }
        // Pick the most-visible slide.
        let bestIdx = -1;
        let bestRatio = 0;
        slides.forEach((el, i) => {
          const r = visibility.get(el) ?? 0;
          if (r > bestRatio) {
            bestRatio = r;
            bestIdx = i;
          }
        });
        if (bestIdx === -1 || bestRatio < 0.5) return;
        const nextView = VIEW_OPTIONS[bestIdx].v;
        setView((prev) => {
          if (prev === nextView) return prev;
          // Persist only when a real swipe (post-initial-load) changed the view.
          if (hasLoadedRef.current) {
            if (putTimerRef.current) clearTimeout(putTimerRef.current);
            putTimerRef.current = setTimeout(() => {
              apiFetch('/api/preferences', {
                method: 'PUT',
                body: JSON.stringify({ scheduleView: nextView }),
              }).catch(() => {});
            }, 300);
          }
          return nextView;
        });
      },
      { root, threshold: [0.25, 0.5, 0.75, 1] }
    );

    slides.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      if (putTimerRef.current) clearTimeout(putTimerRef.current);
    };
  }, [loading]);

  const handleEventClick = (ev) => {
    if (ev?.htmlLink && typeof window !== 'undefined') {
      window.open(ev.htmlLink, '_blank', 'noopener,noreferrer');
    }
  };

  // Tap-to-jump from the segmented control.
  const jumpTo = (v) => {
    const idx = VIEW_INDEX[v];
    const slide = slideRefs.current[idx];
    if (slide) {
      slide.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    }
  };

  return (
    <PhoneFrame>
      <AppHeader
        left={
          <Link href="/settings" className="ss-iconbtn" aria-label="Settings">
            <Icon name="user" size={16} />
          </Link>
        }
        center={
          <Greeting
            day={todayLabels?.day || 'TODAY'}
            date={todayLabels?.date}
          />
        }
        right={
          <Link href="/preview" className="ss-iconbtn" aria-label="AI preview">
            <Icon name="sparkles" size={16} color="var(--go)" />
          </Link>
        }
      />
      <Segment
        value="schedule"
        onChange={(v) => {
          if (v === 'tasks') router.push('/tasks');
        }}
        options={[
          { value: 'schedule', label: 'Schedule', icon: 'calendar' },
          { value: 'tasks', label: 'Tasks', icon: 'list' },
        ]}
      />
      <div
        style={{
          padding: '0 20px 8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: 4 }}>
          {VIEW_OPTIONS.map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => jumpTo(o.v)}
              style={{
                background: view === o.v ? 'var(--surface-2)' : 'transparent',
                border:
                  '1px solid ' + (view === o.v ? 'var(--hairline-strong)' : 'transparent'),
                color: view === o.v ? 'var(--fg)' : 'var(--fg-2)',
                padding: '5px 10px',
                borderRadius: 8,
                fontSize: 11,
                fontFamily: 'inherit',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                textTransform: 'uppercase',
                letterSpacing: 0.04,
              }}
            >
              <Icon name={o.i} size={11} /> {o.v}
            </button>
          ))}
        </div>
        <span
          style={{
            fontSize: 11,
            color: 'var(--fg-3)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {events.length} blocks
        </span>
      </div>
      {allDayEvents.length > 0 ? (
        <div style={{ padding: '0 20px 8px' }}>
          <div
            style={{
              background: 'var(--surface-1)',
              border: '1px solid var(--hairline)',
              borderRadius: 10,
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: 9,
                letterSpacing: 0.08,
                textTransform: 'uppercase',
                color: 'var(--fg-2)',
                fontFamily: 'var(--font-mono)',
                flexShrink: 0,
              }}
            >
              All day
            </span>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                fontSize: 11,
                color: 'var(--fg-1)',
                minWidth: 0,
              }}
            >
              {allDayEvents.map((ev, i) => (
                <span
                  key={ev.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    minWidth: 0,
                  }}
                >
                  {i > 0 ? (
                    <span style={{ color: 'var(--fg-3)' }}>·</span>
                  ) : null}
                  <span
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: 140,
                    }}
                    title={ev.title}
                  >
                    {ev.title}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {loading ? (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            padding: '0 16px',
            overflowY: 'auto',
          }}
        >
          <SkelStack component={RowSkel} count={5} />
        </div>
      ) : (
        <div
          ref={carouselRef}
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
          }}
          className="ss-carousel"
        >
          <style jsx>{`
            .ss-carousel::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div
            ref={(el) => {
              slideRefs.current[0] = el;
            }}
            style={{
              flex: '0 0 100%',
              scrollSnapAlign: 'start',
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <ScheduleListView events={events} onEventClick={handleEventClick} />
          </div>
          <div
            ref={(el) => {
              slideRefs.current[1] = el;
            }}
            style={{
              flex: '0 0 100%',
              scrollSnapAlign: 'start',
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <ScheduleTimelineView events={events} onEventClick={handleEventClick} />
          </div>
          <div
            ref={(el) => {
              slideRefs.current[2] = el;
            }}
            style={{
              flex: '0 0 100%',
              scrollSnapAlign: 'start',
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <ScheduleHybridView events={events} onEventClick={handleEventClick} />
          </div>
        </div>
      )}
    </PhoneFrame>
  );
}
