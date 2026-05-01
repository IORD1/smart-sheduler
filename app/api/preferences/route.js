import { getCollection, getUserId } from '../../../lib/mongo';
import { apiError, handleRoute } from '../../../lib/api';

const DEFAULTS = {
  theme: 'dark',
  accent: 'lime',
  scheduleView: 'list',
  dismissedSuggestions: [],
  selectedCalendarIds: [],
};
const ALLOWED_THEMES = ['dark', 'light'];
const ALLOWED_ACCENTS = ['lime', 'sky', 'rose', 'amber'];
const ALLOWED_SCHEDULE_VIEWS = ['list', 'timeline', 'hybrid'];

const VALIDATORS = {
  theme: (v) => ALLOWED_THEMES.includes(v),
  accent: (v) => ALLOWED_ACCENTS.includes(v),
  scheduleView: (v) => ALLOWED_SCHEDULE_VIEWS.includes(v),
  dismissedSuggestions: (v) => Array.isArray(v) && v.every((x) => typeof x === 'string'),
  selectedCalendarIds: (v) => Array.isArray(v) && v.every((x) => typeof x === 'string'),
};

const ALLOWED_MESSAGES = {
  theme: `theme must be one of ${ALLOWED_THEMES.join(', ')}`,
  accent: `accent must be one of ${ALLOWED_ACCENTS.join(', ')}`,
  scheduleView: `scheduleView must be one of ${ALLOWED_SCHEDULE_VIEWS.join(', ')}`,
  dismissedSuggestions: 'dismissedSuggestions must be an array of strings',
  selectedCalendarIds: 'selectedCalendarIds must be an array of strings',
};

export const GET = handleRoute(async (request) => {
  const userId = getUserId(request);

  const prefs = await getCollection('preferences');
  const doc = await prefs.findOne({ _id: userId });
  if (!doc) return Response.json({ ...DEFAULTS });
  return Response.json({
    theme: ALLOWED_THEMES.includes(doc.theme) ? doc.theme : DEFAULTS.theme,
    accent: ALLOWED_ACCENTS.includes(doc.accent) ? doc.accent : DEFAULTS.accent,
    scheduleView: ALLOWED_SCHEDULE_VIEWS.includes(doc.scheduleView)
      ? doc.scheduleView
      : DEFAULTS.scheduleView,
    dismissedSuggestions: Array.isArray(doc.dismissedSuggestions) ? doc.dismissedSuggestions : [],
    selectedCalendarIds: Array.isArray(doc.selectedCalendarIds)
      ? doc.selectedCalendarIds.filter((x) => typeof x === 'string')
      : [],
  });
});

export const PUT = handleRoute(async (request) => {
  const userId = getUserId(request);

  const body = await request.json().catch(() => ({}));
  const raw = body || {};
  const update = { userId };

  for (const key of Object.keys(VALIDATORS)) {
    if (!Object.prototype.hasOwnProperty.call(raw, key)) continue;
    if (!VALIDATORS[key](raw[key])) {
      throw apiError(400, ALLOWED_MESSAGES[key]);
    }
    update[key] = raw[key];
  }

  const prefs = await getCollection('preferences');
  await prefs.updateOne(
    { _id: userId },
    { $set: update },
    { upsert: true }
  );
  return Response.json({ ok: true });
});
