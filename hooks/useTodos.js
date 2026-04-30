'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { apiFetch } from '../lib/userId';

// Module-level singleton state shared across all useTodos consumers.
const state = {
  todos: [],
  isLoading: true,
  error: null,
};

let initPromise = null;
const listeners = new Set();

let cachedSnapshot = { todos: state.todos, isLoading: state.isLoading, error: state.error };
function refresh() {
  cachedSnapshot = { todos: state.todos, isLoading: state.isLoading, error: state.error };
}
function notify() {
  refresh();
  for (const fn of listeners) fn(cachedSnapshot);
}

function getState() {
  return cachedSnapshot;
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const serverSnapshot = { todos: [], isLoading: true, error: null };

function init() {
  if (typeof window === 'undefined') return Promise.resolve();
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      const data = await apiFetch('/api/todos');
      state.todos = Array.isArray(data?.todos) ? data.todos : [];
      state.error = null;
    } catch (e) {
      state.error = e;
    } finally {
      state.isLoading = false;
      notify();
    }
  })();
  return initPromise;
}

async function refetch() {
  try {
    const data = await apiFetch('/api/todos');
    state.todos = Array.isArray(data?.todos) ? data.todos : [];
    state.error = null;
    notify();
  } catch (e) {
    state.error = e;
    notify();
  }
}

async function addTodo(parsed) {
  const { task, duration = 30, category = null, priority = false } = parsed || {};
  if (!task) return;
  const body = {
    task,
    duration: duration ?? 30,
    category: category ?? null,
    priority: !!priority,
  };
  // Optimistic insert with a temp id. Read position from live state at mutation
  // time so concurrent adds don't collide on a stale closure value.
  const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const optimistic = {
    _id: tempId,
    ...body,
    position: state.todos.length,
    createdAt: new Date().toISOString(),
    _optimistic: true,
  };
  state.todos = [...state.todos, optimistic];
  notify();
  try {
    const data = await apiFetch('/api/todos', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const real = data?.todo;
    if (real) {
      state.todos = state.todos.map((t) => (t._id === tempId ? real : t));
      notify();
    } else {
      // Server returned an unexpected shape; drop the optimistic row and resync.
      state.todos = state.todos.filter((t) => t._id !== tempId);
      notify();
      await refetch();
    }
  } catch (e) {
    state.error = e;
    // Remove the optimistic temp row before resyncing so it doesn't linger.
    state.todos = state.todos.filter((t) => t._id !== tempId);
    notify();
    await refetch();
  }
}

async function removeTodo(id) {
  if (!id) return;
  const snapshot = state.todos;
  state.todos = state.todos.filter((t) => t._id !== id);
  notify();
  try {
    await apiFetch('/api/todos', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  } catch (e) {
    state.error = e;
    state.todos = snapshot;
    notify();
    await refetch();
  }
}

async function reorderTodos(orderedIds) {
  if (!Array.isArray(orderedIds)) return;
  const priorOrder = state.todos;
  const byId = new Map(state.todos.map((t) => [t._id, t]));
  const reordered = orderedIds
    .map((id, idx) => {
      const t = byId.get(id);
      return t ? { ...t, position: idx } : null;
    })
    .filter(Boolean);
  state.todos = reordered;
  notify();
  try {
    await apiFetch('/api/todos/reorder', {
      method: 'POST',
      body: JSON.stringify({
        order: orderedIds.map((id, idx) => ({ id, position: idx })),
      }),
    });
  } catch (e) {
    state.error = e;
    // Restore the prior order before resyncing so the UI doesn't flash an
    // arbitrary intermediate state.
    state.todos = priorOrder;
    notify();
    await refetch();
  }
}

async function clearAll() {
  const snapshot = state.todos;
  state.todos = [];
  notify();
  try {
    await apiFetch('/api/todos', {
      method: 'DELETE',
      body: JSON.stringify({}),
    });
  } catch (e) {
    state.error = e;
    state.todos = snapshot;
    notify();
    await refetch();
  }
}

export function useTodos() {
  const snap = useSyncExternalStore(
    subscribe,
    getState,
    () => serverSnapshot,
  );
  useEffect(() => {
    init().catch((err) => console.error('todos init failed', err));
  }, []);
  return {
    todos: snap.todos,
    isLoading: snap.isLoading,
    error: snap.error,
    addTodo,
    removeTodo,
    reorderTodos,
    clearAll,
  };
}

export default useTodos;
