'use client';

const TOKEN_KEY = 'access_token';
const EXPIRES_KEY = 'expires_in';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar';

let gapiInited = false;
let gisInited = false;
let initPromise = null;
let tokenClient = null;
let token = null;
let expiresIn = null;
let expiresAt = null;
let email = null;
let emailPromise = null;
let signInPromise = null;
const listeners = new Set();

function getUserTimeZone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone; }
  catch { return 'UTC'; }
}

function readStoredToken() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  // Migration: if it doesn't look like JSON, treat as old shape (just a string) → expired.
  if (raw[0] !== '{') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.token !== 'string' || typeof parsed.expiresAt !== 'number') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EXPIRES_KEY);
      return null;
    }
    if (Date.now() >= parsed.expiresAt) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EXPIRES_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    return null;
  }
}

function writeStoredToken(t, exp) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, JSON.stringify({ token: t, expiresAt: exp }));
}

if (typeof window !== 'undefined') {
  const stored = readStoredToken();
  if (stored) {
    token = stored.token;
    expiresAt = stored.expiresAt;
    expiresIn = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  }
}

function gapi() { return typeof window !== 'undefined' ? window.gapi : undefined; }
function google() { return typeof window !== 'undefined' ? window.google : undefined; }

let cachedSnapshot = { ready: false, token, expiresIn, email };
function refresh() {
  cachedSnapshot = { ready: gapiInited && gisInited, token, expiresIn, email };
}
function notify() {
  refresh();
  for (const fn of listeners) fn(cachedSnapshot);
}

export function getState() {
  return cachedSnapshot;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Lazily clear expired tokens.
export function getToken() {
  if (token && expiresAt && Date.now() >= expiresAt) {
    if (gapi()?.client) gapi().client.setToken('');
    clearToken();
    return null;
  }
  return token;
}

// Wait for the gapi/GIS scripts loaded by next/script in app/layout.js.
function waitForScripts(timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (gapi() && google()?.accounts?.oauth2) return resolve();
      if (Date.now() - start > timeoutMs) return reject(new Error('Google scripts failed to load'));
      setTimeout(tick, 50);
    };
    tick();
  });
}

export function init() {
  if (typeof window === 'undefined') return Promise.resolve();
  if (initPromise) return initPromise;
  initPromise = waitForScripts()
    .then(() => Promise.all([initGapi(), initGis()]))
    .then(() => {
      // Re-check freshness on init in case a long offline period elapsed.
      if (token && expiresAt && Date.now() >= expiresAt) {
        clearToken();
      } else if (token) {
        gapi().client.setToken({ access_token: token, expires_in: expiresIn });
      }
      notify();
    })
    .catch((err) => {
      initPromise = null;
      throw err;
    });
  return initPromise;
}

function initGapi() {
  return new Promise((resolve, reject) => {
    const g = gapi();
    g.load('client', async () => {
      try {
        await g.client.init({ apiKey: API_KEY, discoveryDocs: [DISCOVERY_DOC] });
        gapiInited = true;
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
}

function initGis() {
  return new Promise((resolve) => {
    tokenClient = google().accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: '',
    });
    gisInited = true;
    resolve();
  });
}

export function signIn() {
  if (signInPromise) return signInPromise;
  signInPromise = new Promise((resolve, reject) => {
    if (!tokenClient) return reject(new Error('google identity not initialised'));
    tokenClient.callback = (resp) => {
      if (resp.error) return reject(resp);
      const t = gapi().client.getToken();
      token = t.access_token;
      expiresIn = t.expires_in;
      // 60s safety margin so we don't hand off a token that's about to die.
      expiresAt = Date.now() + (Number(expiresIn) - 60) * 1000;
      writeStoredToken(token, expiresAt);
      notify();
      resolve(t);
    };
    try {
      tokenClient.requestAccessToken({ prompt: token ? '' : 'consent' });
    } catch (err) {
      reject(err);
    }
  }).finally(() => {
    signInPromise = null;
  });
  return signInPromise;
}

export function signOut() {
  const current = gapi()?.client?.getToken();
  if (current) {
    google()?.accounts.oauth2.revoke(current.access_token);
    gapi().client.setToken('');
  }
  clearToken();
}

function clearToken() {
  token = null;
  expiresIn = null;
  expiresAt = null;
  email = null;
  emailPromise = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRES_KEY);
  }
  notify();
}

export async function getUserEmail() {
  if (email) return email;
  if (emailPromise) return emailPromise;
  if (!gapi()?.client?.calendar) return null;
  emailPromise = (async () => {
    try {
      const response = await gapi().client.calendar.calendarList.list();
      const items = response?.result?.items || [];
      const primary = items.find((c) => c.primary) || items.find((c) => c.id?.includes('@'));
      const id = primary?.id || null;
      if (id) {
        email = id;
        notify();
      }
      return id;
    } catch (err) {
      clearOnUnauthorized(err);
      return null;
    } finally {
      emailPromise = null;
    }
  })();
  return emailPromise;
}

function clearOnUnauthorized(err) {
  const status = err?.status ?? err?.result?.error?.code;
  if (status === 401 || status === 403) {
    if (gapi()?.client) gapi().client.setToken('');
    clearToken();
  }
}

// Returns the user's full calendar list — used by /settings to render
// the per-calendar opt-in checkboxes.
export async function listCalendars() {
  try {
    const response = await gapi().client.calendar.calendarList.list();
    const items = response?.result?.items || [];
    return items.map((c) => ({
      id: c.id,
      summary: c.summary || c.id,
      primary: !!c.primary,
      backgroundColor: c.backgroundColor || null,
      accessRole: c.accessRole || null,
    }));
  } catch (err) {
    clearOnUnauthorized(err);
    throw err;
  }
}

// Multi-calendar fetch. Failures on individual calendars (revoked access,
// transient 5xx) are logged and skipped — the rest still render.
export async function listEventsTodayFromCalendars(calendarIds) {
  const ids = Array.isArray(calendarIds) && calendarIds.length > 0
    ? calendarIds
    : ['primary'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const timeMin = today.toISOString();
  const timeMax = tomorrow.toISOString();

  const settled = await Promise.allSettled(
    ids.map((id) =>
      gapi().client.calendar.events.list({
        calendarId: id,
        timeMin,
        timeMax,
        showDeleted: false,
        singleEvents: true,
        maxResults: 25,
        orderBy: 'startTime',
      })
    )
  );

  // If primary itself 401/403'd, treat it as auth failure (clear token).
  // For secondaries, log + drop. Tag each event with its source calendar
  // so the UI/AI can relabel cross-calendar "Busy" mirrors.
  const merged = [];
  settled.forEach((r, i) => {
    const id = ids[i];
    if (r.status === 'fulfilled') {
      const items = r.value?.result?.items || [];
      for (const item of items) {
        merged.push({
          ...item,
          sourceCalendarId: id,
          sourceIsPrimary: id === 'primary',
        });
      }
    } else {
      if (id === 'primary') {
        clearOnUnauthorized(r.reason);
        throw r.reason;
      }
      console.warn(`failed to fetch events for calendar ${id}:`, r.reason);
    }
  });

  merged.sort((a, b) => {
    const aStart = a.start?.dateTime || a.start?.date || '';
    const bStart = b.start?.dateTime || b.start?.date || '';
    return aStart.localeCompare(bStart);
  });
  return merged;
}

export async function listEventsToday() {
  return listEventsTodayFromCalendars(['primary']);
}

export async function insertEvent({ summary, location, description, startISO, endISO, recurrence }) {
  try {
    const tz = getUserTimeZone();
    const event = {
      kind: 'calendar#event',
      summary,
      location,
      description,
      start: { dateTime: startISO, timeZone: tz },
      end: { dateTime: endISO, timeZone: tz },
      reminders: { useDefault: true },
    };
    if (Array.isArray(recurrence) && recurrence.length > 0) {
      event.recurrence = recurrence;
    }
    const response = await gapi().client.calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      sendUpdates: 'all',
    });
    return response.result;
  } catch (err) {
    clearOnUnauthorized(err);
    throw err;
  }
}
