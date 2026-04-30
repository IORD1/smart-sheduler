import { getCollection, getUserId } from '../../../lib/mongo';
import { handleRoute } from '../../../lib/api';
import { buildSuggestions } from '../../../lib/suggestions';

export const GET = handleRoute(async (request) => {
  const userId = getUserId(request);

  const [prefsCol, todosCol] = await Promise.all([
    getCollection('preferences'),
    getCollection('todos'),
  ]);

  const [prefsDoc, todos] = await Promise.all([
    prefsCol.findOne({ _id: userId }),
    todosCol.find({ userId }).sort({ position: 1 }).toArray(),
  ]);

  const prefs = {
    theme: prefsDoc?.theme ?? 'dark',
    accent: prefsDoc?.accent ?? 'lime',
    dismissedSuggestions: prefsDoc?.dismissedSuggestions ?? [],
  };

  // Event history not persisted yet — pass empty arrays.
  const events = [];
  const history = [];

  const all = buildSuggestions({ todos, events, history, prefs });
  const dismissed = new Set(prefs.dismissedSuggestions);
  const suggestions = all.filter((s) => !dismissed.has(s.id));

  return Response.json({ suggestions });
});
