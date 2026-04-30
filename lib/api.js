// Shared API helpers for App Router route handlers.
//
// Use `handleRoute` to wrap an async handler — it returns a 4xx JSON for known
// `ApiError`s and a generic 500 for anything unexpected.

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function apiError(status, message) {
  return new ApiError(status, message);
}

export function jsonError(status, message) {
  return Response.json({ error: message }, { status });
}

export function handleRoute(handler) {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (err) {
      if (err instanceof ApiError) {
        return jsonError(err.status, err.message);
      }
      // Unknown failure — log server-side, hide details from client.
      console.error('[api] unhandled error:', err);
      return jsonError(500, 'Internal error');
    }
  };
}
