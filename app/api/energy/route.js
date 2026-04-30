import { getCollection, getUserId } from '../../../lib/mongo';
import { apiError, handleRoute } from '../../../lib/api';
import { CATEGORY_KEYS } from '../../../lib/categories';

function isMin(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1440;
}

function validateWindow(w, idx) {
  if (!w || typeof w !== 'object') {
    throw apiError(400, `windows[${idx}] must be an object`);
  }
  if (typeof w.label !== 'string') {
    throw apiError(400, `windows[${idx}].label must be a string`);
  }
  if (!isMin(w.startMin)) {
    throw apiError(400, `windows[${idx}].startMin must be a number 0-1440`);
  }
  if (!isMin(w.endMin)) {
    throw apiError(400, `windows[${idx}].endMin must be a number 0-1440`);
  }
  if (w.level !== 1 && w.level !== 2 && w.level !== 3) {
    throw apiError(400, `windows[${idx}].level must be 1, 2, or 3`);
  }
  if (w.type !== null && w.type !== undefined && !CATEGORY_KEYS.includes(w.type)) {
    throw apiError(400, `windows[${idx}].type must be null or a valid category`);
  }
  if (w.note !== undefined && typeof w.note !== 'string') {
    throw apiError(400, `windows[${idx}].note must be a string when present`);
  }
}

export const GET = handleRoute(async (request) => {
  const userId = getUserId(request);

  const energy = await getCollection('energy');
  const doc = await energy.findOne({ _id: userId });
  return Response.json({
    windows: doc?.windows ?? [],
    hasInitialized: doc?.hasInitialized === true,
  });
});

export const PUT = handleRoute(async (request) => {
  const userId = getUserId(request);

  const body = await request.json().catch(() => ({}));
  const raw = body || {};

  if (!Array.isArray(raw.windows)) {
    throw apiError(400, 'windows must be an array');
  }
  raw.windows.forEach(validateWindow);

  const update = { userId, windows: raw.windows };

  if (Object.prototype.hasOwnProperty.call(raw, 'hasInitialized')) {
    if (typeof raw.hasInitialized !== 'boolean') {
      throw apiError(400, 'hasInitialized must be a boolean');
    }
    update.hasInitialized = raw.hasInitialized;
  }

  const energy = await getCollection('energy');
  await energy.updateOne(
    { _id: userId },
    { $set: update },
    { upsert: true }
  );
  return Response.json({ ok: true });
});
