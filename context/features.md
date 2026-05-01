# Smart Scheduler — Feature List

## Authentication
- Google sign-in via Google Identity Services + gapi (OAuth scope: `calendar`)
- Token persisted in localStorage with expiry; lazy refresh; sign-out revokes the token

## Brain dump (`/tasks`)
- Chip composer: type `Tennis @1h #health !` and chips render live for duration, category, priority
- Quick-add templates for common tasks
- Drag-to-reorder drafts (`@dnd-kit`)
- Drafts persist in MongoDB and survive reload
- Undo on delete (3.5s grace window)
- Loading skeletons during initial fetch

## AI scheduling (`/preview`)
- Calls Gemini server-side via `/api/schedule` (key never ships to the client)
- Fits drafts around existing calendar events + your energy windows
- AI summary card explains what was placed
- Drag-to-reorder NEW blocks; locked existing events stay pinned
- "Add to Calendar" writes new events to your primary calendar
- Partial-failure handling: shows which rows failed + retry button
- Regenerate via the sparkles button
- Loading skeletons (the Gemini call takes 3–10s)

## Schedule (`/schedule`)
- Three views — list / timeline / hybrid — as a horizontal swipe carousel
- Chosen view is persisted per-user
- All-day events shown as a separate strip
- Click an event to open it in Google Calendar
- Empty/loading states use skeleton rows

## Multi-calendar support
- `/settings` lets you pick which Google Calendars feed into the schedule + AI
- Primary calendar is always included; secondaries are opt-in
- Per-calendar fan-out fetch (`Promise.allSettled`) — a failed calendar just logs and skips
- Untitled events from secondary calendars are labeled "Work Busy" so the AI treats them as work blocks
- Writes always target your primary calendar

## Smart suggestions (`/suggestions`)
- Heuristic suggestions: gap-fill, recurring-pattern, duration-drift
- Dismiss persists across sessions
- Refresh button re-runs heuristics

## Energy map (`/energy`)
- Five editable energy windows (peak / mid / dip / second wind / evening)
- Per-window: start/end time, level (1–3), category type, free-form note
- Feeds the AI prompt so focus work lands in peaks and admin in dips
- First-time users get sensible defaults seeded automatically

## Settings (`/settings`)
- Theme: dark / light
- Accent color: lime / sky / rose / amber
- Calendar opt-in checkboxes (multi-calendar)
- Sign-out
- Theme + accent applied pre-paint via an inline bootstrap (no flash)

## PWA
- Installable on Android / desktop via Chrome's "Install" prompt
- Apple home-screen icon for iOS
- Standalone display mode; portrait orientation
- Minimal service worker (registered for installability; no caching yet)

## Architecture
- Next.js 15 App Router (JS, no TypeScript)
- MongoDB for todos, energy windows, preferences, dismissed suggestions
- Server-side Gemini calls (model: configurable in `services/gemini.js`)
- `userId` from a localStorage UUID, sent as `x-user-id` header on every API call
- Module-singleton + `useSyncExternalStore` for shared client state (auth)
- Vanilla CSS with design tokens (`styles/tokens.css`); no Tailwind
