# Smart Scheduler — Architecture & Features

A small React SPA that pulls today's Google Calendar events, lets the user enter free-form todos with durations, then asks Google's Gemini model to fit those todos into the gaps and writes the resulting blocks back to Google Calendar.

Repo name keeps the typo: `smart-sheduler`.

## Stack

- **Framework:** React 18 (`react`, `react-dom`) bootstrapped via Create React App (`react-scripts` 5.0.1).
- **Build/dev:** `npm start` (CRA dev server, port 3000), `npm run build` (CRA production build), `npm test` (CRA + Jest + RTL). Not ejected.
- **AI:** `@google/generative-ai` ^0.1.3, currently model `gemini-3-flash-preview` (configured in `src/services/gemini.js`).
- **Google APIs:** `gapi` + Google Identity Services, both loaded as `<script>` tags in `public/index.html` (`apis.google.com/js/api.js`, `accounts.google.com/gsi/client`). Not npm modules — they live on `window.gapi` and `window.google`.
- **Styling:** plain CSS files co-located with components. Montserrat from Google Fonts. Background art and icons live in `src/components/assets/`.
- **State:** React `useState` only, plus one `useSyncExternalStore` for auth. No router, no Redux/Zustand, no React Query.
- **Persistence:** `localStorage` keys `access_token` and `expires_in`.
- **Secrets:** `.env` vars prefixed `REACT_APP_*` (CRA-injected). `.env` is gitignored. The Gemini and Calendar keys still ship in the browser bundle — fine for local, not safe for a public deploy.

## File layout

```
public/
  index.html            # loads gapi + GIS via <script>
  manifest.json, favicons
src/
  index.js              # ReactDOM root, StrictMode
  App.js                # renders <Home/>
  App.css, index.css    # base styles
  constants.js          # default location/description, RRULE, work hours, color palettes, env-derived API keys
  lib/
    time.js             # convertDateTime, parseAmPmToISO, formatDuration, parseTodoText
    parseJson.js        # bracket-depth JSON extractor for free-form model output
  services/
    googleCalendar.js   # module singleton: gapi/GIS init, signIn/Out, listEventsToday, insertEvent + pub/sub
    gemini.js           # scheduleTodos({events, todos}) — prompt build, generateContent call, defensive parse + retry
  hooks/
    useGoogleAuth.js    # useSyncExternalStore wrapper over googleCalendar's pub/sub
  components/
    Home.js             # orchestrator: tab state, wires hook + services + screens
    AuthorizeScreen.js  # welcome + authorize button
    Schedule.js         # today's event list
    Tasks.js            # composes TodoList + TodoInput
    TodoInput.js
    TodoList.js
    Logo.js             # static "Smart Sheduler" wordmark
    TodayDate.js        # formatted today's date
    Home.css            # all UI styles
    assets/             # images + SVGs + TodayDate.css
context/
  todo.md               # empty
  architecture.md       # this file
```

## Auth flow (Google OAuth via GIS)

`services/googleCalendar.js` is a module singleton. It owns the imperative state (`gapiInited`, `gisInited`, the `tokenClient`, the cached `token`/`expiresIn`) and exposes a tiny pub/sub. React subscribes via `hooks/useGoogleAuth.js` (`useSyncExternalStore`), so the UI rerenders on auth changes without making the singleton a hook (which would lose its single-instance nature on remount).

1. `useGoogleAuth` calls `init()` on mount. `init()` is idempotent — it caches its own promise so React 18's StrictMode double-invocation can't double-prompt or double-init.
2. `init()` runs `gapi.client.init({apiKey, discoveryDocs})` and `google.accounts.oauth2.initTokenClient({client_id, scope})` in parallel. If a `token` was already in `localStorage`, it's restored to gapi.
3. Scopes: `https://www.googleapis.com/auth/calendar`. Discovery doc: Calendar v3 REST.
4. `signIn()` calls `tokenClient.requestAccessToken({prompt: token ? '' : 'consent'})`. On success the token is stored in `localStorage` and pushed to subscribers.
5. `signOut()` revokes via `google.accounts.oauth2.revoke`, clears `localStorage`, notifies subscribers.
6. **401 handling:** `listEventsToday` and `insertEvent` catch `status === 401` (or `result.error.code === 401`), drop the cached token, and notify subscribers — the UI flips back to the authorize screen instead of silently rendering empty data on a stale token.

## Calendar integration (`services/googleCalendar.js`)

- **Read:** `listEventsToday()` fetches up to 10 events on `primary` between today's start and tomorrow's start (`singleEvents: true`, `orderBy: 'startTime'`). Returns the array (empty if none).
- **Write:** `insertEvent({summary, location, description, startISO, endISO})` calls `gapi.client.calendar.events.insert` with `sendUpdates: 'all'`, the configured `RRULE` and `timeZone` from `src/constants.js`. Returns the created event. The "open every event in a new tab" behavior was removed — the orchestrator awaits all inserts and refreshes the event list once.

## AI scheduling flow (`services/gemini.js`)

1. `scheduleTodos({events, todos})` builds a prompt:
   - Filters existing events to those with `start.dateTime` (skips all-day) and renders each as `"I have to {summary} scheduled from {start} to {end}."`.
   - Renders todos as `"I want to do {task} and require {Xh Ym} time."`.
   - Instructs the model to return ONLY a JSON object of the exact shape `{"todos":[{"task":"...","start_time":"H:MM AM/PM","end_time":"H:MM AM/PM"}]}`. Working hours are taken from `WORK_HOUR_START`/`WORK_HOUR_END` in `constants.js`.
2. The model output is parsed via `lib/parseJson.js` `extractJson()` — strips ```json fences if present, then walks the string with a brace-depth counter (string-aware) to slice the first balanced `{...}` or `[...]`. This replaced the old "find first `{`, last ` ``` `, regex-rename keys" approach.
3. If `JSON.parse` or shape validation fails, one retry follow-up is sent: "your previous response was not valid JSON, return only JSON".
4. Result is shape-validated (top-level `todos` array; each item has string `task`/`start_time`/`end_time`) before being returned.
5. The orchestrator (`Home.js`) then calls `parseAmPmToISO(t.start_time)` / `parseAmPmToISO(t.end_time)` from `lib/time.js` and inserts each block via `googleCalendar.insertEvent`.

`parseAmPmToISO` uses `(h % 12) + (PM ? 12 : 0)`, which correctly handles 12 AM (→ 0) and 12 PM (→ 12). The previous helper added 12 to PM unconditionally (12:30 PM → hour 24).

## UI

- **`Home.js`** (orchestrator): owns `activeTab`, `events`, `todos`, `isScheduling`, `statusMessage`. Reads `{ready, token, signIn, signOut}` from `useGoogleAuth`. Two `useEffect`s: one to load today's events when `ready && token`, one to bind the Ctrl+→ key handler.
- **`AuthorizeScreen`** renders when there's no `token`. Calls `onAuthorize` which runs `signIn()` and then `listEventsToday()`.
- **Logged-in shell** renders the navbar (logout / today / "schedule it" arrow), a tab row, and either `<Schedule events={events}/>` or `<Tasks .../>`.
- **`Tasks`** composes `TodoList` + `TodoInput`. Both are top-level component definitions in their own files — defining them inside `Home` (as before) caused them to remount on every parent render, eating input focus.
- **Tabs:** `Schedule` and `Tasks`, switched via click or **Ctrl+→**.
- **Todo input syntax:** `task name @<hours>` — e.g., `Read book @1.5`. `parseTodoText` (`lib/time.js`) extracts task and decimal hours.
- **Status feedback:** "Scheduled N events" inline message after a successful run; error text on failure. The previous `window.open` per inserted event has been removed.

## Configuration

`src/constants.js` centralises:
- `DEFAULT_EVENT_LOCATION`, `DEFAULT_EVENT_DESCRIPTION`, `EVENT_RRULE`, `EVENT_TIME_ZONE`
- `WORK_HOUR_START`, `WORK_HOUR_END`
- `TASK_BACKGROUND_COLORS`, `TASK_FONT_COLORS` (used by `Schedule` and `TodoList` for the cycling row colors)
- `GOOGLE_CLIENT_ID`, `GOOGLE_API_KEY`, `GEMINI_API_KEY` (read from `process.env.REACT_APP_*`)
- `CALENDAR_DISCOVERY_DOC`, `CALENDAR_SCOPES`

## Things still worth doing

- **Direct-from-browser API key.** The Gemini and Calendar keys ship in the JS bundle, visible to anyone who opens devtools. For any public deploy, proxy these calls through a tiny backend.
- **SDK is old.** `@google/generative-ai` ^0.1.3 predates `responseMimeType: "application/json"` and `responseSchema`. Bumping it would let us replace `parseJson.js` with structured output. Not blocking.
- **No router.** Tab state lives in `Home.js` — fine for two tabs, but adding `react-router` will start to pay for itself once there's a settings page or a per-day history view.
- **`REACT_APP_DEFAULT_ATTENDEE_EMAIL`** is currently unused. The original code passed it to `addManualEvent` but never put it into the event body. Either wire it as an actual `attendees` entry (will send invite emails on every scheduled event) or drop the env var.
