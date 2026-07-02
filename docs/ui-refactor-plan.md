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

- [ ] Define a Vuetify `theme` in `src/main.js` with `light` + `dark` themes.
- [ ] Add named color tokens: `primary`, `secondary`, `surface`, plus custom `offense`,
      `defense`, `home`, `away`, `firstDown`.
- [ ] Remove reliance on `base.css` `--color-*` vars and the native
      `@media (prefers-color-scheme: dark)` block (`src/assets/base.css`).
- [ ] Repoint `KickoffPlaySelector.vue` off `var(--color-*)` onto theme tokens; drop its
      `!important` / `:deep()` overrides.
- [ ] Add app shell: `v-app-bar` (title + live scoreboard + clock) in `src/App.vue`.
- [ ] Wrap content in `v-main` + `v-container` (`src/App.vue` / `GameLayout.vue`).
- [ ] Move dev actions ("Get Other Team Lineup", "Get Game Status", "Full Sync", raw JSON)
      into a dev-only `v-menu`/`v-navigation-drawer` behind a flag (`GameLayout.vue`).

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

Goal: guide the manager through the play sequence and give real feedback.

- [ ] Introduce a `v-stepper` for the flow: Play Type -> Set Lineup -> Call Play -> Run Play
      (`GameLayout.vue`).
- [ ] Move `lineupSubmitted` / flow state into the store so it survives and steps gate
      correctly (`stores/gameStore`, `PlayLineup.vue`).
- [ ] Add `:loading` to async buttons: Run Play, Submit Lineup, Submit Play
      (`GameLayout.vue`, `PlayLineup.vue`, `PlaySelectors/*`).
- [ ] Add `v-skeleton-loader` placeholders while fetching game data.
- [ ] Add global `v-snackbar` + `v-alert` for errors; replace `console.warn` in
      `KickoffPlaySelector.vue` `setKickoffPlay` fallback.
- [ ] Redesign the play-result moment: `v-card` + colored `v-alert`/`v-chip` keyed on
      `result_type` (gain=success, turnover=error), `v-expand-transition`, prominent yardage
      (`PlayResult.vue`).
- [ ] Consider `v-timeline` for `PlayHistory.vue` to read like a drive log.

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
