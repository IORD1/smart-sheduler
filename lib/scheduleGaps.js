import { tToMin } from './time';

// Threshold used by all three Schedule views so the visual treatment is
// consistent across List / Hybrid / Timeline.
export const SCHEDULE_GAP_MIN = 30;

// Compute schedule gaps for the three Schedule views.
//
// events: Array<{start, end}> as "HH:mm" strings.
// opts:
//   minGapMin: only gaps >= this many minutes are returned (default 30).
//   includeEdges: if true, also include leading (dayStart → first event) and
//     trailing (last event → dayEnd) gaps. Useful for absolute-positioned
//     timeline views that draw against the hour grid. List/Hybrid keep this
//     false so we don't render leading/trailing "free" rows.
//   dayStart, dayEnd: only used when includeEdges is true.
//
// Returns Array<{startMin, endMin, durMin}> sorted by startMin.
export function computeScheduleGaps(events = [], opts = {}) {
  const {
    minGapMin = SCHEDULE_GAP_MIN,
    includeEdges = false,
    dayStart = 8 * 60,
    dayEnd = 22 * 60,
  } = opts;

  const sorted = [...(events || [])]
    .filter((e) => e && e.start && e.end)
    .map((e) => ({ startMin: tToMin(e.start), endMin: tToMin(e.end) }))
    .sort((a, b) => a.startMin - b.startMin);

  const gaps = [];

  if (includeEdges && sorted.length > 0) {
    const firstStart = sorted[0].startMin;
    if (firstStart - dayStart >= minGapMin) {
      gaps.push({ startMin: dayStart, endMin: firstStart, durMin: firstStart - dayStart });
    }
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const cursor = sorted[i].endMin;
    const nextStart = sorted[i + 1].startMin;
    if (nextStart - cursor >= minGapMin) {
      gaps.push({ startMin: cursor, endMin: nextStart, durMin: nextStart - cursor });
    }
  }

  if (includeEdges && sorted.length > 0) {
    const lastEnd = sorted[sorted.length - 1].endMin;
    if (dayEnd - lastEnd >= minGapMin) {
      gaps.push({ startMin: lastEnd, endMin: dayEnd, durMin: dayEnd - lastEnd });
    }
  }

  return gaps;
}
