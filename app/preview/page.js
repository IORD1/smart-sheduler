'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import PhoneFrame from '../../components/ui/PhoneFrame';
import AppHeader from '../../components/ui/AppHeader';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import AISummaryCard from '../../components/features/AISummaryCard';
import ProposalRow from '../../components/features/ProposalRow';
import DraggableList from '../../components/features/DraggableList';
import { AISummarySkel, ProposalRowSkel, SkelStack } from '../../components/ui/Skeletons';
import { dateToHHMM, tToMin, parseAmPmToISO, minToT, ampmToHHMM } from '../../lib/time';
import { classify } from '../../lib/categories';
import { apiFetch } from '../../lib/userId';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { listEventsTodayFromCalendars, insertEvent } from '../../services/googleCalendar';
import { useTodos } from '../../hooks/useTodos';

function eventStartHHMM(ev) {
  if (ev.start?.dateTime) return dateToHHMM(ev.start.dateTime);
  if (ev.start?.date) return '00:00';
  return '00:00';
}

function eventEndHHMM(ev) {
  if (ev.end?.dateTime) return dateToHHMM(ev.end.dateTime);
  if (ev.end?.date) return '23:59';
  return '00:00';
}

function simplifyEvent(ev) {
  const fallback = ev.sourceIsPrimary === false ? 'Work Busy' : '(untitled)';
  const title = ev.summary || fallback;
  return {
    id: ev.id,
    title,
    start: eventStartHHMM(ev),
    end: eventEndHHMM(ev),
    category: classify(title),
  };
}

export default function PreviewPage() {
  const router = useRouter();
  const { ready, token } = useGoogleAuth();
  const { todos = [], isLoading: todosLoading, clearAll, removeTodo } = useTodos();
  const [events, setEvents] = useState([]);
  const [proposal, setProposal] = useState(null); // {items, summary}
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [regenSeed, setRegenSeed] = useState(0);
  // partial-failure state: { added: number, total: number, failed: [{row, error}] }
  const [partialResult, setPartialResult] = useState(null);

  // Stable signature so the effect doesn't refire on every todos array reference.
  const todoSignature = useMemo(
    () =>
      todos
        .map((t) => `${t._id}:${t.task}:${t.duration}:${t.category}:${t.priority}`)
        .join('|'),
    [todos]
  );

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      setLoading(false);
      return;
    }
    if (todosLoading) return;

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        let calendarIds = ['primary'];
        try {
          const prefs = await apiFetch('/api/preferences');
          if (Array.isArray(prefs?.selectedCalendarIds)) {
            calendarIds = ['primary', ...prefs.selectedCalendarIds];
          }
        } catch (_e) {
          // fall back to primary
        }

        const rawEvents = await listEventsTodayFromCalendars(calendarIds);
        if (cancelled) return;
        setEvents(rawEvents);
        const simplified = rawEvents.map(simplifyEvent);

        let energy = [];
        try {
          const res = await apiFetch('/api/energy');
          energy = Array.isArray(res?.windows) ? res.windows : [];
        } catch (_e) {
          energy = [];
        }

        const body = JSON.stringify({
          events: simplified,
          todos: todos.map((t) => ({
            id: t._id,
            task: t.task,
            duration: t.duration,
            category: t.category,
            priority: t.priority,
          })),
          energy,
        });

        const data = await apiFetch('/api/schedule', { method: 'POST', body });
        if (cancelled) return;

        const items = Array.isArray(data?.todos) ? data.todos : [];
        const summary =
          data?.summary ||
          data?.rationale ||
          'Slotted your tasks into the gaps between today’s events.';

        setProposal({ items, summary });
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Could not generate schedule.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, token, todosLoading, todoSignature, regenSeed]);

  const combined = useMemo(() => {
    if (!proposal) return [];
    const existing = events.map((ev) => {
      const fallback = ev.sourceIsPrimary === false ? 'Work Busy' : '(untitled)';
      const title = ev.summary || fallback;
      return {
        id: ev.id,
        title,
        start: eventStartHHMM(ev),
        end: eventEndHHMM(ev),
        category: classify(title),
        locked: true,
        new: false,
      };
    });
    const newOnes = proposal.items.map((p, idx) => {
      const rawStart = p.start_time || p.start;
      const rawEnd = p.end_time || p.end;
      const start = ampmToHHMM(rawStart) || rawStart;
      const end = ampmToHHMM(rawEnd) || rawEnd;
      return {
        id: p.id || `n-${idx}-${p.task || p.title}`,
        title: p.title || p.task,
        start,
        end,
        category: p.category || classify(p.title || p.task || ''),
        priority: !!p.priority,
        locked: false,
        new: true,
      };
    });
    const all = [...existing, ...newOnes];
    all.sort((a, b) => tToMin(a.start) - tToMin(b.start));
    return all;
  }, [events, proposal]);

  const newCount = combined.filter((i) => i.new).length;
  const eventCount = combined.filter((i) => !i.new).length;

  const [orderedIds, setOrderedIds] = useState(null);
  const displayItems = useMemo(() => {
    if (!orderedIds) return combined;
    const map = new Map(combined.map((i) => [i.id, i]));
    return orderedIds.map((id) => map.get(id)).filter(Boolean);
  }, [combined, orderedIds]);

  const handleReorder = (ids) => setOrderedIds(ids);

  const handleDiscard = () => router.push('/tasks');

  // Match a proposal row back to a draft todo so we can remove just the
  // successfully-added drafts on partial failure. The Gemini response strips
  // ids, so we fall back to title matching.
  const findDraftIdForRow = (row) => {
    if (!row) return null;
    const direct = todos.find((t) => t._id === row.id);
    if (direct) return direct._id;
    const title = (row.title || '').trim().toLowerCase();
    if (!title) return null;
    const byTitle = todos.find(
      (t) => (t.task || '').trim().toLowerCase() === title
    );
    return byTitle?._id || null;
  };

  // Insert a list of rows; return per-row result.
  const runInsertBatch = async (rows) => {
    const results = [];
    for (const row of rows) {
      try {
        const startISO = parseAmPmToISO(minToT(tToMin(row.start)));
        const endISO = parseAmPmToISO(minToT(tToMin(row.end)));
        await insertEvent({
          summary: row.title,
          startISO,
          endISO,
        });
        results.push({ row, status: 'ok' });
      } catch (err) {
        results.push({
          row,
          status: 'failed',
          error: err?.message || 'Insert failed',
        });
      }
    }
    return results;
  };

  const finalizeBatch = async (results, totalCount) => {
    const succeeded = results.filter((r) => r.status === 'ok');
    const failed = results.filter((r) => r.status === 'failed');

    if (failed.length === 0) {
      await clearAll?.();
      router.push('/schedule');
      return;
    }

    // Partial failure: remove only the successfully-added drafts where we can
    // resolve them, leave the rest for the user.
    const idsToRemove = succeeded
      .map((r) => findDraftIdForRow(r.row))
      .filter(Boolean);
    for (const id of idsToRemove) {
      try {
        await removeTodo?.(id);
      } catch (_e) {
        // best-effort — drafts can be cleaned up manually
      }
    }
    setPartialResult({
      added: succeeded.length,
      total: totalCount,
      failed: failed.map((r) => ({ row: r.row, error: r.error })),
    });
  };

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setPartialResult(null);
    try {
      const newRows = displayItems.filter((i) => i.new);
      const results = await runInsertBatch(newRows);
      await finalizeBatch(results, newRows.length);
    } catch (err) {
      setError(err?.message || 'Failed to add events to calendar.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetryFailed = async () => {
    if (submitting || !partialResult) return;
    const failedRows = partialResult.failed.map((f) => f.row);
    if (failedRows.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const results = await runInsertBatch(failedRows);
      // total now is failedRows.length plus the previously-added count.
      const newSucceeded = results.filter((r) => r.status === 'ok');
      const stillFailed = results.filter((r) => r.status === 'failed');

      if (stillFailed.length === 0) {
        // All retried succeeded. Remove their drafts too, then clear remaining.
        const idsToRemove = newSucceeded
          .map((r) => findDraftIdForRow(r.row))
          .filter(Boolean);
        for (const id of idsToRemove) {
          try {
            await removeTodo?.(id);
          } catch (_e) {
            // ignore
          }
        }
        setPartialResult(null);
        await clearAll?.();
        router.push('/schedule');
        return;
      }

      // Still some failed — also remove drafts for rows that succeeded this round.
      const idsToRemove = newSucceeded
        .map((r) => findDraftIdForRow(r.row))
        .filter(Boolean);
      for (const id of idsToRemove) {
        try {
          await removeTodo?.(id);
        } catch (_e) {
          // ignore
        }
      }
      setPartialResult((prev) => ({
        added: (prev?.added || 0) + newSucceeded.length,
        total: prev?.total || failedRows.length,
        failed: stillFailed.map((r) => ({ row: r.row, error: r.error })),
      }));
    } catch (err) {
      setError(err?.message || 'Failed to retry events.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegenerate = () => setRegenSeed((s) => s + 1);

  return (
    <PhoneFrame>
      <AppHeader
        left={
          <button
            type="button"
            className="ss-iconbtn"
            onClick={() => router.push('/tasks')}
            aria-label="Back"
          >
            <Icon name="arrowL" size={16} />
          </button>
        }
        center={
          <div className="ss-greeting">
            <div className="day" style={{ color: 'var(--go)' }}>
              AI PROPOSAL
            </div>
            <div className="date">Review &amp; confirm</div>
          </div>
        }
        right={
          <button
            type="button"
            className="ss-iconbtn"
            aria-label="Regenerate"
            onClick={handleRegenerate}
            disabled={loading || submitting}
          >
            <Icon name="sparkles" size={16} color="var(--go)" />
          </button>
        }
      />

      {ready && !token ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
            padding: '0 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ color: 'var(--fg-1)', fontSize: 14, fontWeight: 600 }}>
            Sign in to preview your day
          </div>
          <div style={{ color: 'var(--fg-2)', fontSize: 12, lineHeight: 1.5 }}>
            We need your Google Calendar to fit your todos around existing events.
          </div>
          <Button variant="go" onClick={() => router.push('/')}>
            <Icon name="sparkles" size={14} /> Continue with Google
          </Button>
        </div>
      ) : loading ? (
        <>
          <AISummarySkel />
          <div
            className="ss-scroll"
            style={{ flex: 1, minHeight: 0, padding: '0 16px' }}
          >
            <SkelStack component={ProposalRowSkel} count={4} />
          </div>
        </>
      ) : error ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '0 16px',
          }}
        >
          <div
            className="ss-card"
            style={{
              width: '100%',
              color: 'var(--prio)',
              fontSize: 12,
              lineHeight: 1.5,
              textAlign: 'center',
            }}
          >
            {error}
          </div>
          <Button variant="ghost" onClick={handleRegenerate}>
            <Icon name="sparkles" size={13} /> Try again
          </Button>
        </div>
      ) : proposal && proposal.items.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            padding: '0 24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--fg-1)',
            }}
          >
            AI couldn’t fit any of your tasks today
          </div>
          <div
            style={{ fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.5 }}
          >
            Try shorter durations, fewer events, or come back when your
            calendar opens up.
          </div>
          <Button variant="go" onClick={() => router.push('/tasks')}>
            <Icon name="arrowL" size={14} /> Back to Tasks
          </Button>
          <button
            type="button"
            onClick={handleRegenerate}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--fg-2)',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
              textDecoration: 'underline',
              padding: 4,
            }}
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          <AISummaryCard
            newCount={newCount}
            eventCount={eventCount}
            summary={proposal?.summary}
          />

          {partialResult ? (
            <div style={{ padding: '0 16px 12px' }}>
              <div
                className="ss-card"
                style={{
                  borderColor: 'var(--prio)',
                  fontSize: 12,
                  lineHeight: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ color: 'var(--fg)', fontWeight: 600 }}>
                  Added {partialResult.added} of {partialResult.total} events
                </div>
                <div style={{ color: 'var(--fg-2)' }}>
                  Failed:{' '}
                  {partialResult.failed.map((f, i) => (
                    <span key={i} style={{ color: 'var(--prio)' }}>
                      {i > 0 ? ', ' : ''}
                      {f.row.title}
                    </span>
                  ))}
                </div>
                <div>
                  <Button
                    variant="ghost"
                    onClick={handleRetryFailed}
                    disabled={submitting}
                  >
                    <Icon name="sparkles" size={13} />{' '}
                    {submitting ? 'Retrying…' : 'Retry failed'}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <div
            className="ss-scroll"
            style={{ flex: 1, minHeight: 0, padding: '0 16px' }}
          >
            <div className="ss-stack ss-stack-tight">
              <DraggableList
                items={displayItems}
                getId={(i) => i.id}
                onReorder={handleReorder}
                renderItem={(ev, { dragHandleProps }) => (
                  <ProposalRow
                    ev={ev}
                    dragHandleProps={ev.locked ? undefined : dragHandleProps}
                  />
                )}
              />
            </div>
            <div style={{ height: 16 }} />
          </div>
        </>
      )}

      <div
        style={{
          padding: '12px 16px 18px',
          display: 'flex',
          gap: 10,
        }}
      >
        <Button
          variant="ghost"
          onClick={handleDiscard}
          style={{ flex: 1 }}
          disabled={submitting}
        >
          <Icon name="x" size={14} /> Discard
        </Button>
        <Button
          variant="go"
          onClick={handleConfirm}
          style={{ flex: 2 }}
          disabled={loading || !!error || submitting || newCount === 0}
        >
          <Icon name="check" size={16} stroke={2.4} />{' '}
          {submitting ? 'Adding…' : 'Add to Calendar'}
        </Button>
      </div>
    </PhoneFrame>
  );
}
