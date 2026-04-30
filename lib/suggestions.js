import { tToMin, minToT, durMin, formatDuration } from './time';
import { classify } from './categories';

// Find time gaps in a sorted list of events (each {start, end} as "HH:mm")
// inside [dayStart, dayEnd] (minutes-since-midnight). Gaps shorter than
// minGapMin are filtered out.
export function detectGaps(events = [], dayStart = 8 * 60, dayEnd = 22 * 60, minGapMin = 60) {
  const sorted = [...(events || [])]
    .filter((e) => e && e.start && e.end)
    .map((e) => ({ startMin: tToMin(e.start), endMin: tToMin(e.end) }))
    .sort((a, b) => a.startMin - b.startMin);

  const gaps = [];
  let cursor = dayStart;
  for (const ev of sorted) {
    if (ev.startMin > cursor) {
      const startMin = cursor;
      const endMin = Math.min(ev.startMin, dayEnd);
      const durationMin = endMin - startMin;
      if (durationMin >= minGapMin) {
        gaps.push({ startMin, endMin, durationMin });
      }
    }
    cursor = Math.max(cursor, ev.endMin);
    if (cursor >= dayEnd) break;
  }
  if (cursor < dayEnd) {
    const durationMin = dayEnd - cursor;
    if (durationMin >= minGapMin) {
      gaps.push({ startMin: cursor, endMin: dayEnd, durationMin });
    }
  }
  return gaps;
}

// Detect events that recur on the same weekday across history.
// history: Array<{title, dayOfWeek}> where dayOfWeek is 0..6 (Sun..Sat).
// Returns [{title, suggestedRRULE}].
export function detectRecurring(history = []) {
  if (!history || history.length === 0) return [];

  const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  const counts = new Map();
  for (const item of history) {
    if (!item || !item.title) continue;
    const key = `${item.title.toLowerCase()}|${item.dayOfWeek}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const seen = new Set();
  const out = [];
  for (const [key, n] of counts.entries()) {
    if (n < 3) continue;
    const [title, dowStr] = key.split('|');
    if (seen.has(title)) continue;
    seen.add(title);
    const dow = Number(dowStr);
    const byday = BYDAY[dow] || 'MO';
    // Find an original-cased title.
    const original = history.find((h) => h.title.toLowerCase() === title)?.title || title;
    out.push({ title: original, suggestedRRULE: `RRULE:FREQ=WEEKLY;BYDAY=${byday}` });
  }
  return out;
}

// Suggest updated default duration when actual durations diverge from planned.
// history: Array<{title, plannedMin, actualMin}>.
export function detectDurationDrift(history = []) {
  if (!history || history.length === 0) return [];

  const grouped = new Map();
  for (const item of history) {
    if (!item || !item.title || item.plannedMin == null || item.actualMin == null) continue;
    const key = item.title.toLowerCase();
    const bucket = grouped.get(key) || { title: item.title, planned: item.plannedMin, actuals: [] };
    bucket.actuals.push(item.actualMin);
    grouped.set(key, bucket);
  }

  const out = [];
  for (const { title, planned, actuals } of grouped.values()) {
    if (actuals.length < 3) continue;
    const avg = Math.round(actuals.reduce((a, b) => a + b, 0) / actuals.length);
    if (Math.abs(avg - planned) >= 10) {
      out.push({ title, planned, actual: avg });
    }
  }
  return out;
}

// Compose ready-to-render suggestion cards.
export function buildSuggestions({ todos = [], events = [], history = [], prefs } = {}) {
  const cards = [];

  const gaps = detectGaps(events);
  if (gaps.length > 0) {
    const g = gaps[0];
    cards.push({
      id: `gap-${g.startMin}`,
      icon: 'lightning',
      title: `You've got a ${formatDuration(g.durationMin)} gap`,
      subtitle: `${minToT(g.startMin)} – ${minToT(g.endMin)} · Perfect for deep focus`,
      action: 'Suggest a task',
      category: 'focus',
    });
  }

  for (const r of detectRecurring(history)) {
    cards.push({
      id: `recur-${r.title}`,
      icon: 'repeat',
      title: `${r.title} usually happens this day`,
      subtitle: 'Make it recurring?',
      action: 'Repeat weekly',
      category: classify(r.title),
    });
  }

  for (const d of detectDurationDrift(history)) {
    cards.push({
      id: `dur-${d.title}`,
      icon: 'bell',
      title: `${d.title} usually goes ${formatDuration(d.actual)}, not ${formatDuration(d.planned)}`,
      subtitle: 'Update default duration',
      action: 'Update',
      category: classify(d.title),
    });
  }

  // Fallback: if todos cluster on a single category, surface a static energy hint.
  if (cards.length === 0 && todos && todos.length > 0) {
    const cats = new Set(todos.map((t) => t.category).filter(Boolean));
    if (cats.size <= 1 && (cats.has('focus') || cats.has('work'))) {
      cards.push({
        id: 'static-energy-3pm',
        icon: 'lightning',
        title: 'Energy dips at 3pm — move admin tasks here',
        subtitle: 'Schedule lower-effort work in the afternoon dip',
        action: 'Try it',
        category: 'work',
      });
    }
  }

  // Ensure something to show in this iteration.
  if (cards.length === 0) {
    cards.push({
      id: 'static-energy-3pm',
      icon: 'lightning',
      title: 'Energy dips at 3pm — move admin tasks here',
      subtitle: 'Schedule lower-effort work in the afternoon dip',
      action: 'Try it',
      category: 'work',
    });
  }

  return cards;
}

// Re-export time helpers so callers can match formatting.
export { formatDuration, minToT, tToMin, durMin };
