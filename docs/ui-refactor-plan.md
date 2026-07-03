# Game UI Refactor Plan

Tracking document for improving how the Game is displayed (GameLayout + children).
Phases are ordered by priority (P0 first). Each phase has granular, independently
checkable tasks so work can be done in fine-grained increments.

Status legend: [ ] todo · [~] in progress · [x] done · [-] skipped

---

## Analysis Summary

The Game UI is a flat vertical `<div>` stack rooted at `GameLayout.vue`. Main issues:

- **No Vuetify theme** — colors are hardcoded hex across ~10 components; `color="primary"`
  etc. resolve to defaults. No single source of truth for look & feel.
- **Two competing color systems** — `base.css` `--color-*` vars + native
  `prefers-color-scheme` dark block (only used by `KickoffPlaySelector`) vs. Vuetify
  (unthemed). Causes light/dark inconsistency.
- **Mixed native + Vuetify controls** — `PlayTypeSelector` and `PlayHistory` use raw
  `<button>`; others use `v-btn`. Result panels are hand-rolled `<div>` grids.
- **Weak hierarchy** — multiple `<h1>`s, no cards/sections, dev buttons mixed with gameplay.
- **No game-flow guidance** — play sequence is implicit; `lineupSubmitted` is local state.
- **No async feedback** — no loading/error/empty states; failures `console.warn` only.
- **Non-responsive football field** — fixed 600x300px, inline-styled overlays.

Known bugs found during analysis (fold into phases):
- `TeamLineup.vue:24` — `storeToRefs(useGameStore)` missing `()`; `gameMsg` is broken.
- Play-type has two sources of truth (`GameLayout.currentPlayType` local ref vs. store
  `nextPlayType`).

---

## Phase 0 — Foundation (P0)

Goal: establish a single source of truth for theming and app structure. Everything else
builds on this.

- [x] Define a Vuetify `theme` in `src/main.js` with `light` + `dark` themes.
- [x] Add named color tokens: `primary`, `secondary`, `surface`, plus custom `offense`,
      `defense`, `home`, `away`, `firstDown`.
- [x] Remove reliance on `base.css` `--color-*` vars and the native
      `@media (prefers-color-scheme: dark)` block (`src/assets/base.css`).
- [x] Repoint `KickoffPlaySelector.vue` off `var(--color-*)` onto theme tokens; drop its
      `!important` / `:deep()` overrides.
- [x] Add app shell: `v-app-bar` (title + live scoreboard + clock) in `src/App.vue`.
- [x] Wrap content in `v-main` + `v-container` (`src/App.vue` / `GameLayout.vue`).
- [x] Move dev actions ("Get Other Team Lineup", "Get Game Status", "Full Sync", raw JSON)
      into a dev-only `v-menu`/`v-navigation-drawer` behind a flag (`GameLayout.vue`).

> Phase 0 completed. Notes:
> - Theme lives in `src/main.js` (`light` + `dark`, with a light-mode `background`/`surface`
>   split and MD-style semantic colors). A theme toggle (`useTheme()`) sits in the app bar.
> - App shell (`v-app-bar` + live scoreboard/clock + `v-main` + `v-container`) was placed in
>   `src/views/GameView.vue` rather than `App.vue`, because the scoreboard is game-specific
>   and `App.vue` hosts multiple routes (LandingPage renders its own full-screen layout).
> - The `<h1>Game</h1>` added in Phase 1 was removed; the app-bar title now serves that role.
> - `base.css` no longer defines `--color-*`/dark media query; `body` uses `--v-theme-*`.
>   Leftover `WelcomeItem.vue` still references old `--color-*` vars but is dead code
>   (not rendered) — cleanup is tracked in Phase 3.
> - Dev actions ("raw JSON" toggle lives in `GameStatus.vue`; the other three moved to a
>   `v-menu` gated by `import.meta.env.DEV`).
>
> Follow-up (post-Phase 0): the standalone scoreboard `v-card` in `GameStatus.vue`
> duplicated the app-bar scoreboard. `GameStatus.vue` was refactored into a **compact
> horizontal status bar** (teams/score, quarter, clock, down &amp; distance, ball position,
> raw-data toggle) and **embedded directly in the app bar** (`GameView.vue`), replacing the
> inline scoreboard markup. The `FootballField` card moved into `GameLayout.vue`'s left
> column, and `<GameStatus />` was removed from the page body. Chips use `d-none d-sm-flex`
> / `d-md-inline` / `d-lg-flex` to progressively hide lower-priority info on narrow screens.

## Phase 1 — Consistency & Structure (P1)

Goal: unify on Vuetify components and give the page a scannable, grouped layout.

- [x] Convert `PlayTypeSelector.vue` native `<button>` list -> `v-btn-toggle` / `v-chip-group`.
- [x] Convert `PlayHistory.vue` native accordion -> `v-expansion-panels`.
- [x] Wrap Scoreboard section in a `v-card` (`GameStatus.vue`).
- [x] Wrap Field section in a `v-card` (`GameStatus.vue` / `FootballField.vue`).
- [x] Wrap Lineups section in a `v-card` (`PlayLineup.vue` / `TeamLineup.vue`).
- [x] Wrap Play Call section in a `v-card` (`PlaySelectors/*`).
- [x] Wrap Play Result section in a `v-card` (`PlayResult.vue`).
- [x] Wrap Play History section in a `v-card` (`PlayHistory.vue`).
- [x] Lay sections out in a responsive `v-row`/`v-col` grid (e.g., field + scoreboard
      side-by-side on desktop) (`GameLayout.vue`).
- [x] Fix heading hierarchy: one `<h1>`/app-bar title per view; section headers use
      `v-card-title` / `text-h6` (`GameStatus.vue`, `TeamLineup.vue`).
- [x] Fix `TeamLineup.vue:24` -> `storeToRefs(useGameStore())`.
- [x] Consolidate play-type to a single store source (remove `GameLayout.currentPlayType`
      local ref; drive from store).

> Phase 1 completed. Colors on `.side-highlight` / `.team-highlight` were repointed to
> `--v-theme-*` tokens; final palette lands in Phase 0 theming. Dev buttons ("Get Other
> Team Lineup", "Get Game Status", "Full Sync") grouped into the header card's actions —
> moving them behind a dev-only menu remains a Phase 0 task.

## Phase 2 — Gameplay UX (P2)

Goal: guide the manager through the play sequence and give real feedback. Ordered so the
error/async foundation lands first; everything else plugs into it.

Tasks are grouped: **Foundation** (store state) -> **Feedback** (surface it) -> **Guidance**
(flow) -> **Optional**.

### Foundation — store async/error state

- [x] Add a store-level `error` ref (or small notifications concept) and per-action loading
      flags (e.g., `isRunningPlay`, `isSubmittingLineup`, `isSubmittingPlay`) to
      `stores/gameStore`. Today every method swallows failures into `gameMsg` + `console.error`
      and there is **no loading state at all** — this is the precondition for the tasks below.

> Foundation completed (commit `bf9d987`): added `error` ref, `clearError()`, and per-action
> flags (`isRunningPlay`, `isSubmittingLineup`, `isSubmittingPlay`). All async store methods now
> set `error` in their `catch` blocks and toggle their flag via `try/finally`. Fixed two latent
> bugs: `setOffensivePlay`/`setDefensivePlay` had no `try/catch`, and `catch (error)` blocks were
> shadowing the new `error` ref (renamed to `catch (err)`).

### Feedback — surface it to the user

- [x] Add a global `v-snackbar` (+ inline `v-alert` where appropriate) that reads the store
      `error`. Route existing `console.error` (store `catch` blocks) and the `console.warn`
      fallback in `KickoffPlaySelector.vue` `submitPlay` through it. Note: `setKickoffPlay`
      already exists, so that fallback branch is effectively dead — real errors need to surface
      from the store `catch` blocks.
- [x] Wire `:loading` on the async buttons using the flags above: Run Play (`GameLayout.vue`),
      Submit Lineup (`PlayLineup.vue`), Submit Play (`PlaySelectors/*`).
- [x] Redesign the play-result moment: colored `v-alert`/`v-chip` keyed on
      `playResult.result.result_type` (gain=success, turnover=error), `v-expand-transition`,
      prominent `playResult.result.result` yardage (`PlayResult.vue`).

> Feedback completed. Notes:
> - Global `v-snackbar` (color `error`, 6s timeout, close button) lives in `GameView.vue`, bound
>   to the store `error` via a writable computed that calls `clearError()` on close.
> - `KickoffPlaySelector.vue` `submitPlay` dead `console.warn` fallback removed; it now always
>   calls `setKickoffPlay` so errors surface through the store `catch` -> snackbar.
> - `:loading` wired: Run Play -> `isRunningPlay`, Submit Lineup -> `isSubmittingLineup`,
>   all three play selectors' Submit Play -> `isSubmittingPlay`.
> - `PlayResult.vue`: the plain result-summary grid was replaced by a prominent tonal `v-alert`
>   (icon + outcome label + big yardage number), colored by outcome (`TurnOver`=error,
>   gain=success, no-gain=warning) matching `PlayHistory.vue`'s convention. Keyed on
>   `new_state.play_counter` inside a `v-expand-transition` so it animates on each new play.

### Guidance — make the play sequence legible

- [x] Move `lineupSubmitted` out of `PlayLineup.vue` (local `ref`) into the store as flow
      state, **and reset it in `runPlay()`** — it is currently never reset, so the "Select
      Play" card stays open across plays (`stores/gameStore`, `PlayLineup.vue`).
- [x] Use that flow state to gate/highlight the play-flow sections in the existing two-column
      layout (e.g., disable "Run Play" until lineup submitted, emphasize the active section).
      Lightweight guidance that respects the current grid.

> Guidance completed. Notes:
> - `lineupSubmitted` now lives in `gameStore` (with `setLineupSubmitted()`); it is reset to
>   `false` inside `runPlay()` on success, fixing the never-reset bug (the "Select Play" card
>   no longer stays open across plays). `PlayLineup.vue` reads it via `storeToRefs` and sets it
>   through the action.
> - Gating/highlighting: "Run Play" is `:disabled` until the lineup is submitted, with an inline
>   `v-alert` hint when disabled (`GameLayout.vue`). Once submitted, a "Lineup set" success chip
>   appears next to Submit Lineup and the "Select Play" card is emphasized (`color="primary"`),
>   marking it as the active step (`PlayLineup.vue`).

### Optional / deferred

- [ ] (Optional) `v-timeline` for `PlayHistory.vue` to read like a drive log (data available
      via `getAllPlayResults`).
- [-] `v-stepper` for Play Type -> Set Lineup -> Call Play -> Run Play: demoted. It fights the
      two-column layout established in Phase 0/1 and re-opens the parked layout decision, and
      the flow is not strictly linear (defense has no equivalent "Call Play"; kickoff is
      conditional). The store-driven section gating above delivers the same guidance goal.
- [-] `v-skeleton-loader` while fetching: deferred. State is seeded with defaults and there is
      no clear "empty then load" gap in the game view for skeletons to fill. Revisit if a real
      initial-load gap surfaces.

## Phase 3 — Polish & Responsiveness (P3)

Goal: make the centerpiece responsive and reduce duplication / dead code.

- [ ] Make `FootballField.vue` responsive: aspect-ratio/SVG or `%`-based instead of fixed
      600x300 with inline styles; drive markers from props.
- [ ] Add a `v-progress-linear`-style yardage/field-position bar.
- [ ] Standardize `players/*` stat cards on a shared `v-table`/`v-chip` layout via a single
      `PlayerStatCard` wrapper.
- [ ] Delete scaffolding: `WelcomeItem.vue`, `components/icons/*`, `Basic.vue`.
- [ ] Remove dead/commented code (e.g., bottom ~40 lines of `PlayerSelector.vue`).
- [ ] Switch to per-component Vuetify imports via `vite-plugin-vuetify` for smaller bundles
      (`src/main.js`, `vite.config.js`).

---

## Component Reference (Vuetify targets)

| Concern | Current | Target |
|---|---|---|
| App shell | bare `v-app > RouterView` | `v-app-bar`, `v-main`, `v-navigation-drawer` (dev) |
| Page layout | flat `<div>` stack | `v-container` + `v-row`/`v-col`, `v-card` sections |
| Play-type / play call | native `<button>`, bare `v-select` | `v-btn-toggle`/`v-chip-group`, `v-select`/`v-autocomplete` in `v-form` |
| Guided flow | implicit + local ref | `v-stepper` (or `v-tabs`) |
| Score / status | `<h1>` stack | `v-card` scoreboard, `v-chip`, `v-progress-linear` |
| Play result | `<div>` grid | `v-card` + `v-alert` + `v-list`, `v-expand-transition` |
| Play history | native accordion | `v-expansion-panels` / `v-timeline` |
| Async feedback | none | `v-progress-circular`/`v-skeleton-loader`, `v-snackbar`, `:loading` |
| Theming | none | `createVuetify({ theme })` + `useTheme()` for team accent |
