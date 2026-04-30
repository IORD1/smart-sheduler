import { getCollection, getUserId } from '../../../../lib/mongo';
import { apiError, handleRoute } from '../../../../lib/api';

// Bulk reorder endpoint. Accepts the full new ordering as a single payload and
// applies it in one round-trip via bulkWrite, so reordering N todos no longer
// fans out into N PATCH requests with no atomicity story.
export const POST = handleRoute(async (request) => {
  const userId = getUserId(request);

  const body = await request.json().catch(() => ({}));
  const { order } = body || {};

  if (!Array.isArray(order)) {
    throw apiError(400, 'order must be an array');
  }
  for (const entry of order) {
    if (!entry || typeof entry !== 'object') {
      throw apiError(400, 'each order entry must be an object');
    }
    if (typeof entry.id !== 'string' || entry.id === '') {
      throw apiError(400, 'each order entry requires a string id');
    }
    if (typeof entry.position !== 'number' || !Number.isFinite(entry.position)) {
      throw apiError(400, 'each order entry requires a numeric position');
    }
  }

  if (order.length === 0) {
    return Response.json({ ok: true, updated: 0 });
  }

  const todos = await getCollection('todos');
  const ops = order.map((entry, idx) => ({
    updateOne: {
      filter: { _id: entry.id, userId },
      update: { $set: { position: idx } },
    },
  }));

  const result = await todos.bulkWrite(ops, { ordered: false });
  return Response.json({ ok: true, updated: result.modifiedCount });
});
