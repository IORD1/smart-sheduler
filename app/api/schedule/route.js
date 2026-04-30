import { getUserId } from '../../../lib/mongo';
import { handleRoute, jsonError } from '../../../lib/api';
import { scheduleTodos } from '../../../services/gemini';

export const POST = handleRoute(async (request) => {
  getUserId(request);

  const body = await request.json().catch(() => ({}));
  const { events = [], todos = [] } = body || {};
  const rawEnergy = body?.energy;
  const energy = Array.isArray(rawEnergy)
    ? rawEnergy
    : Array.isArray(rawEnergy?.windows)
      ? rawEnergy.windows
      : [];

  try {
    const result = await scheduleTodos({ events, todos, energy });
    return Response.json(result);
  } catch (err) {
    return jsonError(500, err.message || 'schedule failed');
  }
});
