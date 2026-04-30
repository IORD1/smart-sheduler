import { CATEGORIES } from './categories';

// Parses "Tennis @1h #health !" into { task, duration, category, priority }.
// - @<num>h | @<num>m | @<num>hr | @<num>min — explicit hours or minutes
// - @<num> with no unit defaults to minutes (e.g. "@30" → 30 min)
// - Compound forms like "@1h30m" are summed (→ 90 min)
// - If multiple @ tokens are present, the first one wins; all are stripped
//   from the task text regardless.
// - #<categoryKey> → category (if recognised)
// - ! → priority
// Anything left after stripping these = task.
export function parseTodo(raw) {
  let text = ' ' + (raw || '');
  let category = null;
  let priority = false;
  let duration = null;

  text = text.replace(/\s#(\w+)/gi, (_, w) => {
    const lc = w.toLowerCase();
    if (CATEGORIES[lc]) { category = lc; return ''; }
    return ` #${w}`;
  });

  text = text.replace(/\s!+/g, () => { priority = true; return ''; });

  // Match every @-token (everything after @ up to whitespace). Sum compound
  // components within a single token (e.g. "@1h30m" → 90). The first @-token
  // wins; subsequent @-tokens are stripped but ignored for duration.
  text = text.replace(/\s@(\S+)/g, (_, body) => {
    if (duration != null) return '';
    const partRe = /(\d+(?:\.\d+)?)(h|hr|m|min|mins)?/gi;
    let total = 0;
    let matched = false;
    let m;
    while ((m = partRe.exec(body)) !== null) {
      const num = parseFloat(m[1]);
      const unit = m[2];
      if (unit && /^m/i.test(unit)) {
        // m, min, mins → minutes
        total += Math.round(num);
      } else if (unit) {
        // h, hr → hours
        total += Math.round(num * 60);
      } else {
        // bare number with no unit → minutes
        total += Math.round(num);
      }
      matched = true;
    }
    if (matched) duration = total;
    return '';
  });

  return {
    task: text.replace(/\s+/g, ' ').trim(),
    category,
    priority,
    duration,
  };
}
