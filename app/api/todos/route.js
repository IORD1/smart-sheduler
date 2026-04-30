import { getCollection, getUserId } from '../../../lib/mongo';
import { apiError, handleRoute } from '../../../lib/api';

export const GET = handleRoute(async (request) => {
  const userId = getUserId(request);

  const todos = await getCollection('todos');
  const list = await todos.find({ userId }).sort({ position: 1 }).toArray();
  return Response.json({ todos: list });
});

export const POST = handleRoute(async (request) => {
  const userId = getUserId(request);

  const body = await request.json().catch(() => ({}));
  const raw = body || {};

  // task: required, non-empty string.
  if (raw.task == null || typeof raw.task !== 'string' || raw.task.trim() === '') {
    throw apiError(400, 'task is required');
  }
  const task = raw.task;

  // duration: positive number; default 30 if missing/invalid.
  let duration = 30;
  if (typeof raw.duration === 'number' && Number.isFinite(raw.duration) && raw.duration > 0) {
    duration = raw.duration;
  }

  // category: null or string.
  let category = null;
  if (raw.category != null) {
    if (typeof raw.category !== 'string') {
      throw apiError(400, 'category must be a string or null');
    }
    category = raw.category || null;
  }

  // priority: coerce to boolean.
  const priority = !!raw.priority;

  const todos = await getCollection('todos');
  const position = await todos.countDocuments({ userId });

  const doc = {
    _id: crypto.randomUUID(),
    userId,
    task,
    duration,
    category,
    priority,
    position,
    createdAt: new Date(),
  };
  await todos.insertOne(doc);
  return Response.json({ todo: doc });
});

export const DELETE = handleRoute(async (request) => {
  const userId = getUserId(request);

  const body = await request.json().catch(() => ({}));
  const { id } = body || {};
  const todos = await getCollection('todos');
  if (id) {
    await todos.deleteOne({ _id: id, userId });
  } else {
    await todos.deleteMany({ userId });
  }
  return Response.json({ ok: true });
});
