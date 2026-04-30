import { CATEGORY_KEYS } from '../lib/categories';
import { formatDuration } from '../lib/time';

const WORK_HOUR_START = 9;
const WORK_HOUR_END = 22;

// events: [{ title, start: "HH:mm", end: "HH:mm", category }]
// todos:  [{ task, duration: minutes, category, priority }]
// energy: [{ label, startMin, endMin, level: 1|2|3, type }] | null
export function buildPrompt({ events, todos, energy }) {
  const eventLines = (events || [])
    .map((e) => `- "${e.title}" ${e.start}-${e.end} (#${e.category || 'work'})`)
    .join('\n');

  const todoLines = (todos || [])
    .map((t) => {
      const parts = [`"${t.task}"`, formatDuration(t.duration || 30)];
      if (t.category) parts.push(`#${t.category}`);
      if (t.priority) parts.push('priority');
      return `- ${parts.join(' · ')}`;
    })
    .join('\n');

  const energyLines = (energy || [])
    .map((w) => {
      const tag = w.level === 3 ? 'PEAK' : w.level === 1 ? 'DIP' : 'STEADY';
      return `- ${w.label || ''} (${minToHHMM(w.startMin)}-${minToHHMM(w.endMin)}): ${tag}, prefers #${w.type}${w.note ? ' — ' + w.note : ''}`;
    })
    .join('\n');

  const now = new Date();
  const nowStr = now.toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });

  return [
    'You are a personal scheduling assistant. Plan when each todo should happen TODAY using common-sense timing AND the user energy map below.',
    '',
    `Current local time: ${nowStr}`,
    `Available window: ${WORK_HOUR_START}:00 to ${WORK_HOUR_END}:00.`,
    '',
    "Today's already-scheduled events (LOCKED — cannot be moved or removed):",
    eventLines || '(none)',
    '',
    'Energy windows (when the user is sharpest vs flat):',
    energyLines || '(none — use generic time-of-day heuristics)',
    '',
    'Todos to schedule (use the exact durations given — do not change them):',
    todoLines,
    '',
    'Scheduling rules:',
    '1. Match category to time-of-day:',
    '   - #meal: breakfast 7-9 AM, lunch 12-1 PM, dinner 6-8 PM.',
    '   - #health: prefer morning before 10 AM or evening after 5 PM.',
    '   - #focus: schedule during PEAK energy windows when available.',
    '   - #errand: schedule during DIP energy windows or midday.',
    '   - #work: prefer mornings; never during PEAK windows if a #focus task is waiting.',
    '   - #social: late afternoon or evening.',
    '   - #personal: flexible; fill remaining slots.',
    '2. Use the user-provided category to override generic heuristics when they conflict.',
    '3. Do NOT schedule in the past. Every start_time must be at or after the current local time.',
    '4. Leave at least 10 minutes between back-to-back activities.',
    '5. Never overlap with the LOCKED events listed above.',
    '6. Spread the day naturally — do not stack everything at the start of the window.',
    '7. If a todo cannot fit today within the rules, omit it from the output.',
    '8. Mark each output item with the same category the input had (or your best guess if none was given).',
    '9. Mark priority=true on the output if the input was priority.',
    '',
    'Return ONLY a JSON object (no prose, no markdown fences) with the exact shape:',
    '{"todos":[{"task":"...","start_time":"H:MM AM/PM","end_time":"H:MM AM/PM","category":"...","priority":false}]}',
    '',
    `Top-level key must be exactly "todos". Each item must use the keys "task", "start_time", "end_time", "category", "priority". The "category" must be one of: ${CATEGORY_KEYS.join(', ')}.`,
  ].join('\n');
}

function minToHHMM(min) {
  if (min == null) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export const SCHEMA_HINT_RETRY =
  'Your previous response was not valid JSON. Return ONLY a JSON object of the form {"todos":[{"task":"...","start_time":"...","end_time":"...","category":"...","priority":false}]} with no surrounding text or markdown.';
