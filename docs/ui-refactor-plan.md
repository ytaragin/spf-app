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
>   (icon + outcome label + big yardage number), colored by outcome. (Superseded — see the
>   outcome-unification follow-up below: color is now relative to the managed team's
>   perspective, not a fixed 3-way scheme.) Keyed on `new_state.play_counter` inside a
>   `v-expand-transition` so it animates on each new play.

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

- [x] (Optional) `v-timeline` for `PlayHistory.vue` to read like a drive log (data available
      via `getAllPlayResults`).

> `PlayHistory.vue` now renders plays in a `v-timeline` (`side="end"`, compact) — a vertical
> drive log. Each `v-timeline-item` has a dot colored by outcome and an icon (turnover=alert-octagon,
> gain=arrow-up, else=football), matching the `PlayResult.vue` outcome convention. The expandable
> `PlayResultDetails` was preserved by nesting a single-panel `v-expansion-panels` inside each item,
> so per-play details are still available on demand. Order kept oldest-first to preserve
> "Play 1, 2, 3…" numbering.
>
> Follow-up (outcome logic unified): the color/icon/label logic that was duplicated (and had
> diverged) between `PlayResult.vue` and `PlayHistory.vue` was extracted into a single pure module
> `src/game/playOutcome.js` (`classifyOutcome`, `outcomeColor`, `outcomeIcon`, `outcomeLabel`,
> `outcomeSummary`, `managedTeamHadPossession`). Color is now **relative to the managed team's
> perspective**: a turnover or no-gain reads as `error` when our team had the ball but `success`
> when we were defending. Components pass `favorable = managedTeamHadPossession(play, managedTeam)`.
> This also folds into the Phase 3 "reduce duplication" goal.
>
> Follow-up (possession casing bug): confirmed with the backend that `possession` is
> authoritatively `"Home"`/`"Away"` (capitalized). This exposed a latent bug — the seed
> `gameState.possession` default in `gameStore.js` was lowercase `'home'`, which silently broke
> the exact-case comparisons in `GameStatus.vue` (`possessionTeam`) and `GameLayout.vue`
> (`offenseActive`) until the first real `/game/state` fetch overwrote it. Fixed the seed to
> `'Home'`, and simplified `managedTeamHadPossession` from a case-insensitive compare to an exact
> one, since casing is now known-authoritative.

- [-] `v-stepper` for Play Type -> Set Lineup -> Call Play -> Run Play: demoted. It fights the
      two-column layout established in Phase 0/1 and re-opens the parked layout decision, and
      the flow is not strictly linear (defense has no equivalent "Call Play"; kickoff is
      conditional). The store-driven section gating above delivers the same guidance goal.
- [-] `v-skeleton-loader` while fetching: deferred. State is seeded with defaults and there is
      no clear "empty then load" gap in the game view for skeletons to fill. Revisit if a real
      initial-load gap surfaces.

## Phase 3 — Polish & Responsiveness (P3)

Goal: make the centerpiece responsive and reduce duplication / dead code.

- [x] Make `FootballField.vue` responsive: aspect-ratio/SVG or `%`-based instead of fixed
      600x300 with inline styles; drive markers from props.
- [x] Rework `GameLayout.vue` from two even columns into a wide centered play-flow column +
      a thin sticky side rail (field + play history).
- [ ] Add a `v-progress-linear`-style yardage/field-position bar.
- [x] Standardize `players/*` stat cards on a shared `v-table`/`v-chip` layout via a single
      `PlayerStatCard` wrapper.
- [ ] De-duplicate play-detail rendering: `PlayResult.vue` hand-rolls the details/new-state/
      mechanics/cards markup inline (which has diverged from `PlayResultDetails.vue`), while
      `PlayHistory.vue` reuses `PlayResultDetails`. Make `PlayResult` reuse `PlayResultDetails`
      too, and repoint that component's hardcoded light-theme colors (`#fafafa`/`#fff`/`#272822`)
      onto `--v-theme-*` tokens so it works in dark mode.
- [ ] Delete scaffolding: `WelcomeItem.vue`, `components/icons/*`, `Basic.vue`.
- [ ] Remove dead/commented code (e.g., bottom ~40 lines of `PlayerSelector.vue`).
- [ ] Switch to per-component Vuetify imports via `vite-plugin-vuetify` for smaller bundles
      (`src/main.js`, `vite.config.js`).

> `FootballField.vue` responsiveness done ahead of the rest of Phase 3, pulled forward because
> the upcoming `GameLayout.vue` layout rework (wide centered play-flow + thin side rail) needs a
> field that can flex into a narrow column. The field now fills its container width at a fixed
> `aspect-ratio: 2 / 1` (was a hardcoded 600x300 `v-img`) and renders via a CSS `background-image`
> instead of `v-img` + absolutely-positioned pixel overlays. The line of scrimmage, first-down
> line, and ball are positioned with `%` (derived from the same 0-100 yard-line math, just
> expressed as percentages of field width) instead of pixels computed from `fieldWidth`/
> `fieldHeight` props, so no JS measurement/`ResizeObserver` is needed — it scales purely via
> CSS. Dropped the now-unused `fieldWidth`/`fieldHeight` pixel props (the only caller,
> `GameLayout.vue`, used the defaults) in favor of an optional `maxWidth` cap; `ballPosition` and
> `firstDownTarget` props are unchanged.
>
> `GameLayout.vue` layout rework (first draft, commit `7162bf2`): the two even `md=6` columns
> (field+history | play flow) were replaced by an asymmetric split — a wide **main column**
> (`md=8`/`lg=9`) carrying the play flow (PlayTypeSelector -> PlayLineup -> Run Play -> PlayResult),
> and a **thin right rail** (`md=4`/`lg=3`) holding the `FootballField` above `PlayHistory`. The
> goal was to make the lineup/play flow the visual centerpiece with room to breathe; the field is
> demoted to a supporting glanceable role in the rail (which the responsive-field work above made
> possible). The rail is `position: sticky` on `md+` (`top: 80px` to clear the app bar) so it
> stays in view while working the lineup; on mobile the columns stack (main first, then rail).
> This resolves the "parked layout decision" referenced in Phase 2's demoted `v-stepper` task.
> Deliberately kept a first draft — open knobs for later iteration: exact rail width, a max-width
> cap to keep the main column from over-stretching on very wide monitors, field-vs-history order
> in the rail, and the sticky `top` offset.
>
> `PlayerStatCard` wrapper (step 1 of 2 for the stat-card task): added
> `src/components/players/PlayerStatCard.vue` — a shared `v-card` frame (consistent title via
> `v-card-title`, optional `subtitle`, `density="compact"`, min/max-width so cards fit the narrow
> `PlayerRecord` hover menu, and a default slot for the existing stat markup). All 11 position
> cards (`RB, QB, TE, WR, OL, K, LB, DL, DB, KR, Plain`) were repointed onto it: the loose
> bare-text position labels (`QB`/`K`/`OL`/`DB`/`DL`/`LB`) and KR's bespoke `.kr-title` moved into
> the wrapper `title`; `RB`/`WR`/`TE`, which had no title at all, gained one; `Plain` now renders a
> consistent muted "No player" frame (and was converted from Options API to `<script setup>`).
> `KR.vue`'s hardcoded light-theme hex (`#f5f5f5`/`#1976d2`/`#333`/`#fff3cd`/`#f8d7da`/…) was
> repointed onto `--v-theme-*` tokens (label=`primary`, asterisk=`warning`, fumble=`error`), so it
> no longer breaks in dark mode. The inner stat components (`SingleStat`/`TripleStat`/`RangedStat`/
> `NumberedStat` and KR's `<table>`) were intentionally left unchanged — they just moved into the
> slot. Kept as `[~]`: **step 2** — converting those inner stat components to `v-table`/`v-chip`
> (and deciding exactly where `v-chip` vs `v-table` applies) is the remaining follow-up. Pre-existing
> `vue/multi-word-component-names` lint errors on `K.vue`/`Plain.vue` were left as-is (out of scope;
> renaming ripples into `PlayerRecord.vue`'s component map).
>
> Stat-card task **completed** (step 2 — `v-table`/`v-chip`): the four shared stat sub-components were
> rewritten in place so every position card upgraded with no per-card logic change:
> - `SingleStat` → a small tonal `v-chip` (bold label + value). Cards that render several scalars
>   (RB/WR/TE/OL/DB/DL/LB/QB/K) wrap them in a `d-flex flex-wrap ga-1` chip row; DB/DL/LB dropped
>   their now-pointless `v-container`/`v-row`/`v-col` split, and QB/K hoist their standalone scalars
>   (endurance, extra points, …) into a chip row above the tables.
> - `TripleStat` (RB/WR/TE rushing + pass_gain) → `v-table` (`density="compact"`). **Kept the joined
>   `Q/S/L` single column and `Roll: a/b/c` row format to match the SPF paper sheet** (per request),
>   rather than splitting into per-label columns. `getValue`/`formatStats` logic copied verbatim, so
>   the edge cases hold: missing column → `-`, string cells (`"Lg"`/`"Sg"`) literal, `{Val:0}`/`-1`
>   render as `0`/`-1`.
> - `RangedStat` (QB quick/short/long/pass_rush, K field_goals) → 2-column `v-table` (outcome | dice
>   range); missing range → `-`.
> - `NumberedStat` (QB rushing) → 2-column `v-table` (roll | value); reuses the existing
>   object/`Val` formatting.
> - `KR` matrix → `v-table`; the asterisk/fumble markers stay as tinted cells (`warning`/`error`,
>   already themed) plus the `*`/`f` glyphs and `SameAs`→`-` logic. `v-table` sets its own `td`
>   background, so the tint classes are applied via `:deep(td.asterisk-cell)` etc. with `!important`
>   to win precedence.
>
> Verified: `npm run build` passes; `eslint players/*.vue` shows only the 2 pre-existing
> `multi-word-component-names` errors (unchanged). No committed sample data exists for KR/DB/DL/LB, so
> those were validated against the reverse-engineered shapes from the component templates; the offense
> cards were checked against the root `*.json` reference files.

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
