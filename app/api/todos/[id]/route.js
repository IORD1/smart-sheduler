import { getCollection, getUserId } from '../../../../lib/mongo';
import { apiError, handleRoute } from '../../../../lib/api';

const ALLOWED_FIELDS = ['task', 'duration', 'category', 'priority', 'position'];

export const PATCH = handleRoute(async (request, { params }) => {
  const userId = getUserId(request);

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const update = {};
  for (const k of ALLOWED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body || {}, k)) update[k] = body[k];
  }
  if (Object.keys(update).length === 0) {
    return Response.json({ ok: true });
  }

  const todos = await getCollection('todos');
  const result = await todos.updateOne({ _id: id, userId }, { $set: update });
  if (result.matchedCount === 0) {
    throw apiError(404, 'Todo not found');
  }
  return Response.json({ ok: true });
});
