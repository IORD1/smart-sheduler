# Smart Scheduler — TODO

Goal: every UI element promises something — make every promise true.

Last full pass: 2026-04-30. ~50 audit items burned through across 6 phases (~14 sub-agent invocations).

---

## Manual verification checklist

The build passes clean and API smoke tests pass (validation rejects `theme:"neon"`, accepts `theme:"light"`, GET round-trips, missing `x-user-id` returns 400). The remaining verification needs a browser:

- [ ] **Auth flow** — `npm run dev`, visit http://localhost:3000, click Continue with Google → consent → land on `/schedule`. Today's events render.
- [ ] **Theme flash** — sign in. Toggle Light + Sky in `/settings`. Reload — page paints in light/sky from first frame, no dark flicker. (Inline bootstrap script reads localStorage before paint.)
- [ ] **Schedule swipe** — on `/schedule`, swipe horizontally between list / timeline / hybrid. Segmented control highlights track the swipe. Reload — comes back to last-viewed slide.
- [ ] **All-day events** — if today has any all-day events, they show in an "All day" strip above the carousel.
- [ ] **Tasks chip parser** — type `Tennis @1h30m #health !` → preview shows duration/category/priority chips. Type just `@1h` → "Add a task name" hint. Auto-focus on entry.
- [ ] **QuickAdd auto-submit** — tap `+ Lunch` chip → row inserted immediately, no extra send tap.
- [ ] **Drafts persist + drag** — add 3 drafts, reload → all 3 persist. Drag-reorder → single bulk POST to `/api/todos/reorder`.
- [ ] **Undo delete** — tap trash on a draft → toast appears with Undo. Click Undo within 3.5s → draft restored. Otherwise it deletes.
- [ ] **Schedule with AI** — tap "Schedule N tasks with AI" → `/preview` runs Gemini → proposal renders (this was broken pre-fix; verify rows actually show with start/end times). Drag a NEW row to a new time → Confirm inserts events in shown order.
- [ ] **Sparkles regenerate** — on `/preview`, tap right-side sparkles → re-runs schedule.
- [ ] **Add to Calendar partial failure** — disconnect mid-confirm if you can; succeeded events stay, failed ones surfaced with Retry.
- [ ] **Auth-missing on /preview** — sign out, navigate to `/preview` → "Sign in to continue" CTA, no infinite Loading.
- [ ] **Suggestions Dismiss** — dismiss a card → reload → stays gone.
- [ ] **Suggestions Refresh** — top-right refresh icon re-fetches.
- [ ] **Energy Map editing** — edit label/note/start/end/type/level. Save → "Saved" toast. Reload → persisted.
- [ ] **Energy Map first-mount** — fresh user (delete `energy` doc in Mongo) → opens screen → 5 defaults silent-persist.
- [ ] **Settings shows email** — Account card shows the signed-in Google email.
- [ ] **Sign out** — clears tokens, returns to login.

## Bundle audit

- [ ] Open devtools Network tab while scheduling. The Gemini API key should NOT appear in any client request — calls go to `/api/schedule` and only the server hits Google.

## Known follow-ups (not blocking)

- StatusBar `time` prop is now ignored (vestigial in `PhoneFrame`). Drop the prop in a cleanup pass.
- `context/architecture.md` still mentions `DEFAULT_ATTENDEE_EMAIL` — drop that mention.
- `lib/suggestions.js` and `lib/scheduleGaps.js` overlap conceptually — could merge.
- Hybrid view's mini-timeline rail ignores gap blocks (right-hand list shows them). Could add hatched stripes if desired.
- Rate limiting / authz beyond device-id — not in scope this iteration.

---

## What got done — phase log

### Phase 1 — P0 broken pipelines
- ✅ AI Preview key shape: read `data.todos`, parse `start_time`/`end_time` via new `ampmToHHMM` helper.
- ✅ `/preview` re-run loop: memoized `todoSignature`, gated on `useTodos.isLoading`.
- ✅ `/preview` auth-missing: explicit "Sign in to continue" CTA branch.
- ✅ Login footer copy: replaced "tasks stay on-device" claim.
- ✅ `useTodos` lifted to module-level singleton via `useSyncExternalStore`. Optimistic adds visible across `/tasks` and `/preview`. Bug fixes folded in: position race, POST-failure rollback, undefined-shape guard, reorder snapshot/restore.
- ✅ Schedule view swipe carousel via `scroll-snap` + IntersectionObserver. Choice persisted to `/api/preferences#scheduleView`. Segmented control still tappable.

### Phase 2 — UI stubs
- ✅ Suggestions Dismiss persists via `/api/preferences#dismissedSuggestions` (optimistic + rollback on failure).
- ✅ Suggestions Act dispatches by id prefix (`gap-`/`cluster-` → `/tasks`; `recur-`/`dur-` → dismiss + toast). Action button hidden when no meaningful action.
- ✅ Energy Map Save toast (success + failure). `useEnergy.save` now throws cleanly.
- ✅ Energy Map: `label`/`note`/`type`/`startMin`/`endMin`/`level` all editable per row. Added `hhmmToMin` helper.
- ✅ Energy Map silent default-persist when `hasInitialized: false` and empty windows.
- ✅ `/preview` sparkles button regenerates (regenSeed counter).
- ✅ Drag-reorder on `/preview` already affected insert order (verified, no change needed).
- ✅ `/tasks` left header: replaced redundant settings link with back-arrow to `/schedule`.
- ✅ AISummaryCard pluralization + 0-event ("Plan N tasks for today").
- ✅ "Schedule N task(s) with AI" pluralized.
- ✅ QuickAdd auto-submit via new `onAdd` prop.
- ✅ ChipComposer autoFocus + "Add a task name" empty-task hint.
- ✅ ProposalRow drag icon → `grip` (matches TodoRow).
- ✅ Settings shows signed-in Google email via `gapi.client.calendar.calendarList.list()` primary entry. Cached on auth singleton.
- ✅ EventRow `onClick` opens Google Calendar `htmlLink` in new tab. `htmlLink` threaded through `simplifyEvent` and all 3 view components.
- ✅ Greeting computes actual weekday + date from `new Date()` (in client component, hydration-safe).

### Phase 3 — Empty/error states
- ✅ Add to Calendar partial-failure: per-row results, drafts cleared only for succeeded rows (best-effort title match), Retry button on failed subset.
- ✅ Schedule empty states inline in all 3 views.
- ✅ All-day events split into a strip above the carousel.
- ✅ Suggestions error toast + persistent "showing cached" banner.
- ✅ `/preview` empty-proposal state: "AI couldn't fit any of your tasks today" + Back to Tasks + Try again.
- ✅ `/preview` error retry button (bumps regenSeed).

### Phase 4 — Theme flash fix
- ✅ Inline bootstrap script in `<head>` of `app/layout.js` reads `localStorage` and applies `data-theme` + accent CSS vars before first paint.
- ✅ `useTheme` hydrates from `localStorage` synchronously (lazy init) and writes through on every change.
- ✅ `userTouchedRef` flag skips applying server values if user already toggled.

### Phase 5 — Backend robustness
- ✅ New `lib/api.js` with `ApiError` class + `handleRoute` wrapper. All 6 API routes refactored.
- ✅ `getUserId` throws `ApiError` instead of `Response`.
- ✅ Mongo cached promise clears on connect failure → next request retries.
- ✅ `apiFetch` JSON-parses error bodies → throws `Error(data.error)`.
- ✅ PATCH `/api/todos/[id]` returns 404 on no-match.
- ✅ Validation: `/api/preferences` whitelists theme/accent/scheduleView/dismissedSuggestions; `/api/energy` validates each window shape; `/api/todos` POST validates task non-empty.
- ✅ Gemini `generate()` wrapped with 30s `AbortController`.
- ✅ `signIn()` re-entrancy guarded via `signInPromise`.
- ✅ Token expiry now `expiresAt` deadline (60s safety margin); old shape clears on first reload.
- ✅ `clearOnUnauthorized` handles 401 + 403.
- ✅ `EVENT_TIME_ZONE` replaced with `Intl.DateTimeFormat().resolvedOptions().timeZone`.
- ✅ Bogus daily-recurrence dropped from `insertEvent`.
- ✅ New `/api/todos/reorder` route with `bulkWrite`. `useTodos.reorderTodos` now does one POST.

### Phase 6 — parseTodo + polish + cleanup
- ✅ `parseTodo` handles `@1h30m` (compound), `@<num>` defaults to minutes, first `@` token wins.
- ✅ New `lib/scheduleGaps.js` with `computeScheduleGaps` (30-min threshold). All 3 schedule views render gap rows.
- ✅ Timeline view short-event overlap fixed via `Math.max(h - 4, 22)`.
- ✅ Suggestions refresh button (top-right `repeat` icon).
- ✅ Global error boundary at `app/error.js`.
- ✅ TodoRow undo on delete (3.5s toast in `app/tasks/page.js`).
- ✅ ChipComposer placeholder shows tokens: `Try: tennis @1h #health !`.
- ✅ StatusBar shows real local time (h:mm), updates on minute boundary, hydration-safe.
- ✅ `lib/mongo.js` typo comment.
- ✅ `DEFAULT_ATTENDEE_EMAIL` removed from `.env`.
- ✅ `@google/generative-ai` confirmed already absent.

## Out of scope (this iteration)

- TypeScript migration.
- Tailwind / CSS-in-JS.
- Tests beyond manual checklist.
- Streaming AI responses.
- Real multi-user auth (deviceId UUID stays).
- Service Worker / offline.
