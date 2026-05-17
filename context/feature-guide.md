# Smart Scheduler — Complete Feature Guide

> A planner that looks at your todos, your prescheduled events, and what time of
> day you actually get things done — then proposes a schedule you'd have written
> yourself, if you had the time. Approve it with one tap and it writes straight
> back to Google Calendar.

This document is the long-form companion to `context/features.md`. Where that
file is a terse checklist, this one explains *what the app does, how each piece
works, and why it was built that way* — useful for portfolio write-ups, demos,
onboarding, or just remembering the design intent months from now.

---

## 1. The one-paragraph pitch

Most scheduling tools treat time as a dumb container — here's a slot, shove a
task in. Smart Scheduler treats time like the scarce, opinionated resource it
actually is: you don't do deep work at 9pm, you don't take meetings before
coffee, and Tuesdays feel different from Thursdays. You **brain-dump** your todos
in a natural shorthand (`tennis @1h #health !`), the app reads your **Google
Calendar** and your personal **energy map**, and **Google Gemini** proposes a
full day plan that fits the new tasks into the gaps — focus work in your peaks,
admin in your dips, meals at meal times. You review the proposal, drag rows
around if you disagree, and hit **Add to Calendar**.

---

## 2. Tech stack at a glance

| Layer            | Choice                                                          |
| ---------------- | --------------------------------------------------------------- |
| Framework        | Next.js 15 (App Router), React 18 — JavaScript, no TypeScript   |
| AI               | Google Gemini (`gemini-3-flash-preview`) via REST, server-side  |
| Calendar         | Google Calendar API v3 via `gapi` + Google Identity Services    |
| Database         | MongoDB (todos, energy windows, preferences, dismissals)        |
| Drag & drop      | `@dnd-kit/core` + `@dnd-kit/sortable`                           |
| Styling          | Vanilla CSS with design tokens (`styles/tokens.css`) — no Tailwind |
| Loading UI       | `react-loading-skeleton`                                        |
| Identity         | Per-device UUID in `localStorage` (no password accounts)        |
| Packaging        | Installable PWA (manifest + minimal service worker)             |

The app is designed to look and feel like a **native phone app** — every screen
renders inside a `PhoneFrame` component, so it reads as a polished mobile
product even in a desktop browser.

---

## 3. The core user journey

```
  Login ──▶ Schedule ──▶ Tasks (brain dump) ──▶ AI Preview ──▶ Calendar
   │           │              │                      │
   │           │              │                      └─ writes events back
   │           └─ today's events, 3 views             │
   └─ Google OAuth (calendar scope)                   └─ drag-to-refine, regenerate

  Settings ──▶ Energy Map  ·  Smart Suggestions  ·  Theme  ·  Calendars  ·  Sign out
```

Seven routes, each a single screen:

| Route          | Screen            | Purpose                                       |
| -------------- | ----------------- | --------------------------------------------- |
| `/`            | Login             | Google sign-in, product pitch                 |
| `/schedule`    | Today's schedule  | View existing calendar events for today       |
| `/tasks`       | Brain dump        | Add/parse/reorder todo drafts                 |
| `/preview`     | AI proposal       | Review the Gemini-generated plan, confirm     |
| `/energy`      | Energy map        | Edit your daily energy windows                |
| `/suggestions` | Smart suggestions | Heuristic nudges about your scheduling habits |
| `/settings`    | Settings          | Theme, accent, calendar selection, account    |

---

## 4. Feature deep-dive, screen by screen

### 4.1 Login (`/`)

- **Single sign-in path** — "Continue with Google". There are no passwords; the
  app only ever asks for one OAuth scope: `https://www.googleapis.com/auth/calendar`.
- The pitch copy on this screen teaches the shorthand syntax up front
  (`tennis @1h`, `lunch @30m`) so the brain-dump screen feels familiar.
- Sign-in is **re-entrancy guarded** — rapid double-taps share one in-flight
  promise instead of opening two consent popups.
- On success the user lands on `/schedule`. Sign-in errors render inline.

### 4.2 Schedule (`/schedule`) — today, three ways

This is the home screen after login. It fetches today's events from every
calendar the user opted into and renders them in **three switchable views**,
laid out as a horizontal **swipe carousel**:

| View         | Icon    | What it shows                                              |
| ------------ | ------- | ---------------------------------------------------------- |
| **List**     | list    | Clean vertical list of events with times and categories    |
| **Timeline** | clock   | Events absolutely positioned against an hour grid          |
| **Hybrid**   | layers  | A mini-timeline rail beside the list                       |

- The carousel uses CSS `scroll-snap` plus an `IntersectionObserver` to detect
  which slide is most visible; the segmented control at the top highlights to
  match, and tapping a control smooth-scrolls to that slide.
- **The chosen view is remembered** — it's persisted per-user to
  `/api/preferences#scheduleView` (debounced 300ms) and restored on next visit.
- **All-day events** are split out into a separate "All day" strip above the
  carousel, so they don't distort the time grid.
- **Schedule gaps** — free stretches of ≥30 minutes between events — are
  computed by `lib/scheduleGaps.js` and rendered as gap rows in all three views,
  so empty time is visible, not invisible.
- **Tap any event** to open it directly in Google Calendar (`htmlLink`).
- Empty and loading states are first-class: skeleton rows while fetching, inline
  empty-state messaging when there's nothing scheduled.

### 4.3 Tasks — the brain dump (`/tasks`)

The heart of the app: a fast, low-friction place to dump everything on your
mind. Each entry is a **draft todo** with a duration, an optional category, and
an optional priority flag.

**The chip composer** is the signature interaction. You type tasks the way you'd
say them, and the app parses tokens live into visible chips:

| You type        | Parsed as                                            |
| --------------- | ---------------------------------------------------- |
| `Tennis`        | task name                                            |
| `@1h` `@30m`    | duration — hours or minutes                          |
| `@1h30m`        | compound duration → 90 minutes                       |
| `@45`           | bare number defaults to minutes → 45 minutes         |
| `#health`       | category (one of: work, health, social, focus, errand, personal, meal) |
| `!`             | priority flag                                        |

So `Tennis @1h30m #health !` becomes a 90-minute, health-category, priority
task named "Tennis". Parsing lives in `lib/parseTodo.js`; the first `@` token
wins if you type several. The composer auto-focuses on entry and shows a hint
("Add a task name") if you type a duration with no task.

Other Tasks-screen features:

- **Quick-add templates** — one-tap chips for common tasks (e.g. `+ Lunch`) that
  insert a fully-formed draft immediately, no extra send tap.
- **Drag-to-reorder** drafts via `@dnd-kit`; the new order is saved in a single
  bulk `POST /api/todos/reorder` round-trip (not N requests).
- **Drafts persist** in MongoDB — keyed to the device UUID — and survive reload.
- **Optimistic UI** — adds, deletes, and reorders show instantly and roll back
  on server failure. The todos store is a module-level singleton wired through
  `useSyncExternalStore`, so the same drafts appear consistently on `/tasks` and
  `/preview` without prop-drilling or refetching.
- **Undo on delete** — deleting a draft shows a toast with an Undo button and a
  3.5-second grace window before the delete actually commits to the server.
- A running total ("4 · 3h 20m total") summarizes the brain dump at a glance.
- The primary CTA — "Schedule N tasks with AI" — carries the user to `/preview`.

### 4.4 AI Preview (`/preview`) — the proposal

Tap "Schedule with AI" and this screen does the real work:

1. Fetches today's events from all selected calendars.
2. Loads the user's energy windows.
3. Sends events + draft todos + energy map to `POST /api/schedule`, which calls
   **Gemini server-side** (the API key never reaches the browser).
4. Renders the returned plan as a merged, time-sorted list of **locked existing
   events** and **new AI-placed blocks**.

Features on this screen:

- **AI summary card** explains what the model did ("Slotted your tasks into the
  gaps between today's events"), with correct pluralization and a zero-task case.
- **Drag-to-refine** — you can drag the *new* blocks to reorder them; locked
  existing calendar events stay pinned and aren't draggable. The order you see
  is the order events get inserted.
- **Regenerate** — the sparkles button in the header re-runs the whole plan
  (handy if you don't like the first proposal).
- **Add to Calendar** writes every new block to your **primary** calendar as a
  real event (with default reminders, in your local time zone).
- **Partial-failure handling** — if some inserts succeed and others fail, the
  screen shows exactly which rows failed, removes the drafts for the ones that
  succeeded, and offers a **Retry failed** button that retries only the failures.
- **Robust empty/error states**: an explicit "AI couldn't fit any of your tasks
  today" screen, a retryable error card, and — if the user isn't signed in — a
  "Sign in to preview your day" CTA instead of an infinite spinner.
- Loading uses skeletons, because the Gemini call legitimately takes 3–10s.

### 4.5 Energy Map (`/energy`)

This is what makes the scheduling *personal*. The energy map is a set of
**editable windows** describing your day's rhythm:

- Five default windows are seeded for first-time users: **Morning peak**,
  **Mid-morning**, **Afternoon dip**, **Second wind**, **Evening**. Seeding is
  silent and only happens once (`hasInitialized` flag).
- Each window is fully editable: label, start time, end time, energy **level**
  (1 = dip, 2 = steady, 3 = peak), preferred task **category**, and a free-text
  note.
- The map is fed into the AI prompt, so the model knows to schedule `#focus`
  work in peak windows and `#errand`/admin work in dips.
- Saving shows a success/failure toast; edits persist to MongoDB and survive
  reload. Saves are optimistic and roll back on failure.

### 4.6 Smart Suggestions (`/suggestions`)

A lightweight, **heuristic** (non-AI) advice feed generated by
`lib/suggestions.js`. It surfaces cards such as:

- **Gap-fill** — "You've got a 2h gap, 1:00–3:00 PM · Perfect for deep focus".
- **Recurring-pattern** — if an activity shows up on the same weekday repeatedly
  in history, it suggests making it a weekly recurring event.
- **Duration-drift** — if a task consistently takes longer/shorter than planned,
  it suggests updating the default duration.
- A static energy hint as a fallback so the screen is never empty.

Suggestion cards can be **dismissed** (the dismissal persists across sessions
via `/api/preferences#dismissedSuggestions`) or **acted on** (gap suggestions
jump you to `/tasks`; pattern suggestions dismiss with a "noted" toast). A
refresh button re-runs the heuristics. Note: event/history inputs aren't
persisted yet, so recurring/duration cards are wired but mostly dormant — the
gap and static cards do the visible work today.

### 4.7 Settings (`/settings`)

A single hub for personalization and account control:

- **Theme** — dark / light.
- **Accent color** — lime / sky / rose / amber. Theme and accent are applied
  *before first paint* via an inline bootstrap script in the document head, so
  there's no flash of the wrong theme on reload.
- **Calendar selection (multi-calendar)** — checkboxes for every Google Calendar
  on the account. The primary calendar is always included and locked on;
  secondaries are opt-in. Selected calendars feed both the Schedule screen and
  the AI plan.
- **Quick links** to the Energy Map and Smart Suggestions screens.
- **Account** card shows the signed-in Google email and a Sign-out button.
- Sign-out revokes the OAuth token and clears local state.

---

## 5. The AI scheduling engine

The intelligence lives in three server-side files: `services/ai-prompt.js`
(prompt construction), `services/gemini.js` (the API call + validation), and
`app/api/schedule/route.js` (the route).

**What the model is told:**

- The current local date and time.
- A working window of 9:00–22:00.
- Today's already-scheduled events, marked **LOCKED — cannot be moved**.
- The user's energy windows, tagged PEAK / STEADY / DIP.
- The todos to place, with exact durations.

**The scheduling rules baked into the prompt:**

1. Match category to time of day — meals at meal times, `#health` morning or
   evening, `#focus` during PEAK windows, `#errand` during DIPs, `#social` late.
2. User-provided categories override generic heuristics.
3. Never schedule in the past.
4. Leave ≥10 minutes between back-to-back activities.
5. Never overlap a LOCKED event.
6. Spread the day naturally — don't stack everything at the start.
7. Drop any todo that genuinely can't fit today.

**Reliability measures:**

- The model is asked for **strict JSON** (`{"todos":[...]}`). If the first
  response doesn't parse, `gemini.js` automatically **retries once** with an
  explicit schema-correction hint appended.
- `lib/parseJson.js` pulls the first balanced JSON object out of the response
  even if the model wraps it in prose or ```` ```json ```` fences.
- The result is **validated** — every item must have a string task and times;
  unknown categories are coerced to `personal`; `priority` is coerced to boolean.
- The Gemini fetch is wrapped in a **30-second `AbortController`** timeout so a
  hung request can't hang the route.
- The **API key never ships to the client** — the browser only ever calls
  `/api/schedule`; only the Next.js server talks to Google.

---

## 6. Data, identity, and the backend

### 6.1 Identity model

There are no real user accounts. On first load, the browser generates a
**UUID** and stores it in `localStorage` (`lib/userId.js`). Every API call sends
it as an `x-user-id` header; `apiFetch` injects it automatically. The server
uses it as the Mongo document key. Google OAuth is separate — it only governs
calendar access. This is deliberately a single-device, single-user model
(noted as out of scope to change this iteration).

### 6.2 MongoDB collections

| Collection    | Holds                                                          |
| ------------- | -------------------------------------------------------------- |
| `todos`       | Draft todos: task, duration, category, priority, position      |
| `energy`      | One doc per user: array of energy windows + `hasInitialized`   |
| `preferences` | theme, accent, scheduleView, dismissedSuggestions, selectedCalendarIds |

The connection promise is cached as a global singleton and **cleared on
failure**, so a transient cold-start DNS error doesn't permanently wedge the
server — the next request retries cleanly.

### 6.3 API surface

| Method & route             | Purpose                                            |
| -------------------------- | -------------------------------------------------- |
| `GET/POST/DELETE /api/todos` | List, create, delete (one or all) draft todos    |
| `PATCH /api/todos/[id]`    | Update a single todo (404 if no match)             |
| `POST /api/todos/reorder`  | Bulk reorder via one `bulkWrite`                   |
| `POST /api/schedule`       | Run the Gemini plan                                |
| `GET/PUT /api/energy`      | Read/write energy windows (each window validated)  |
| `GET/PUT /api/preferences` | Read/write preferences (whitelisted, validated)    |
| `GET /api/suggestions`     | Compute heuristic suggestions                      |

All routes go through a shared `handleRoute` wrapper (`lib/api.js`) that turns
known `ApiError`s into clean 4xx JSON and anything unexpected into a generic
500 (details logged server-side, hidden from the client). Inputs are
**validated** — `/api/preferences` rejects `theme:"neon"`, `/api/energy`
validates every window's shape, `/api/todos` POST rejects an empty task.

---

## 7. Google Calendar integration

`services/googleCalendar.js` owns all calendar I/O:

- **Auth** uses Google Identity Services for the token and `gapi` for the
  Calendar client. Tokens are stored in `localStorage` with an **`expiresAt`
  deadline** (60-second safety margin) and lazily cleared when expired.
- **Multi-calendar fetch** — events for all selected calendars are fetched in
  parallel with `Promise.allSettled`. If a *secondary* calendar fails (revoked
  access, transient 5xx) it's logged and skipped; the rest still render. If the
  *primary* calendar 401/403s, that's treated as an auth failure and the token
  is cleared.
- **Cross-calendar labelling** — untitled events from secondary calendars are
  surfaced as **"Work Busy"**, so the AI treats them as real work blocks rather
  than ignoring them.
- **Writes always target the primary calendar**, in the user's resolved time
  zone (`Intl.DateTimeFormat().resolvedOptions().timeZone`), with default
  reminders.
- 401/403 anywhere triggers `clearOnUnauthorized`, which drops the token so the
  app falls back to the sign-in screen instead of looping on errors.

---

## 8. Design system & PWA

- **Mobile-first shell** — every screen renders inside `PhoneFrame`, giving the
  whole app a consistent native-app silhouette.
- **Design tokens** — all color, spacing, and typography come from
  `styles/tokens.css`. Theme and accent are just token swaps.
- **No-flash theming** — an inline `<head>` script reads the saved theme/accent
  from `localStorage` and applies them before the first paint; `useTheme`
  hydrates synchronously from storage and writes through on every change.
- **PWA** — installable on Android and desktop via Chrome's Install prompt, with
  an Apple home-screen icon for iOS, standalone display mode, and portrait
  orientation. A minimal service worker is registered purely for installability
  (no offline caching yet).

---

## 9. Engineering decisions worth remembering

- **Why a device UUID instead of accounts?** It keeps the app zero-friction —
  no sign-up form — while still giving server-side persistence. Real multi-user
  auth was explicitly deferred.
- **Why server-side Gemini?** So the API key is never exposed in client network
  traffic. The browser only knows about `/api/schedule`.
- **Why `useSyncExternalStore` for todos and auth?** Both are genuinely global,
  cross-screen state. A module-level singleton store keeps `/tasks` and
  `/preview` perfectly in sync without a context provider or refetching.
- **Why optimistic everything?** The app should feel instant on a phone. Adds,
  deletes, reorders, energy saves, and suggestion dismissals all update the UI
  immediately and roll back cleanly if the server rejects them.
- **Why the JSON-retry loop?** LLMs occasionally wrap JSON in prose or fences.
  One automatic retry with a schema hint, plus a balanced-brace extractor, makes
  the pipeline resilient without streaming or function-calling complexity.

---

## 10. Known limitations / not-yet-done

- Event history isn't persisted, so the recurring-pattern and duration-drift
  suggestions are wired but mostly dormant.
- The service worker registers for installability only — there's no offline
  caching.
- Identity is single-device (the UUID); there's no cross-device sync or real
  account system.
- No automated tests beyond a manual verification checklist (`context/todo.md`).
- AI responses are not streamed — the proposal appears all at once after the
  3–10s call.

---

*Last updated: 2026-05-17. Companion to `context/features.md` (checklist) and
`context/todo.md` (verification checklist + change log).*
