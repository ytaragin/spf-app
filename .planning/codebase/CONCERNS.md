# Codebase Concerns

**Analysis Date:** 2026-07-13

## Tech Debt

**Dead / placeholder code in game store:**
- Issue: `getHardCodedValue()` returns a magic literal `42` and is exported from the store but never consumed anywhere in `src/`.
- Files: `src/stores/gameStore.js` (defined line 105, exported line 399)
- Impact: Signals unfinished/stub work; misleads readers into thinking it is a real API. Dead exports inflate the store's public surface.
- Fix approach: Delete the function and its export, or replace with the real value/source it was standing in for.

**Boilerplate error-handling comments never removed:**
- Issue: Copy-paste comment scaffolding like `// handle success here`, `// handle error here`, `// handle 400 error here`, and `// convert lineup object to JSON and send it to the server` remains throughout the store methods.
- Files: `src/stores/gameStore.js` (lines 71-76, 86, 126-128, 137)
- Impact: Comments no longer describe the code below them; increases noise and hides intent.
- Fix approach: Remove stale comments; keep only comments that add real intent.

**Commented-out code left in place:**
- Issue: Dead commented lines such as `// gameMsg.value = response.data;` and `// let availablePlayers = ref(new Set([]));` and `//&& teams.value[otherTeam]`.
- Files: `src/stores/gameStore.js` (line 265), `src/stores/teamStore.js` (lines 25, 94)
- Impact: Confuses readers about what is actually active.
- Fix approach: Delete; git history preserves it.

**Duplicated play-submission methods:**
- Issue: `setDefensivePlay`, `setOffensivePlay`, and `setKickoffPlay` are nearly identical (same POST + headers + try/catch/finally shape).
- Files: `src/stores/gameStore.js` (lines 168-238)
- Impact: Three copies of the same error-handling drift over time; a fix to one is easily missed in the others.
- Fix approach: Extract a single `submitPlay(url, payload)` helper and have the three call it.

**Inconsistent equality operators:**
- Issue: Loose equality (`==`, `!=`) is used in hot paths (`id == null || id == ''`) while strict equality is used elsewhere.
- Files: `src/stores/gameStore.js` (lines 91, 98, 111), `src/components/FootballField.vue` (line 66)
- Impact: Loose equality can mask coercion bugs.
- Fix approach: Standardize on `===`/`!==`; add the eslint `eqeqeq` rule.

## Known Bugs

**Play-result polling relies on an increasing `play_counter` that may silently drop plays:**
- Symptoms: `fetchPlayResult` only appends a play if `newPlayCounter > mostRecentPlayCounter`. If two plays resolve between polls (count=1 only fetches the single latest), intermediate plays are lost from `playResults` history.
- Files: `src/stores/gameStore.js` (lines 268-289)
- Trigger: Any flow where more than one play completes server-side between two `fetchPlayResult` calls.
- Workaround: A full sync via `fetchAllPlayResults` (`?result=true`, no count) rebuilds the list; exposed only through the dev-tools "Full Sync" menu.

**`getPlayerByIDBothTeams` can throw when the other team is unloaded:**
- Symptoms: If `team.value.getPlayerByID(id)` misses and `teams.value[otherTeam.value]` is still `undefined` (data not yet fetched), the fallback `teams.value[otherTeam.value].getPlayerByID(id)` throws a TypeError.
- Files: `src/stores/teamStore.js` (lines 91-99)
- Trigger: Looking up a player id before both `players/home` and `players/away` have loaded.
- Workaround: None in code; the original guard was commented out (line 94).

## Security Considerations

**`.env` files are committed to the repository:**
- Risk: `.env`, `.env.development`, and `.env.production` are tracked in git (they are NOT listed in `.gitignore`). Currently they hold only `VITE_API_BASE_URL`, which is a public build-time value, so no secret is leaked today. However, the pattern invites a future secret to be committed.
- Files: `.env`, `.env.development`, `.env.production`, `.gitignore`
- Current mitigation: Only a non-sensitive base URL is stored; all `VITE_`-prefixed vars are public by design and embedded in the client bundle.
- Recommendations: Add `.env*` (with a `!.env.example` exception) to `.gitignore`, keep a committed `.env.example` with placeholder values, and never store secrets in `VITE_`-prefixed vars since they ship to the browser.

**No auth on API requests:**
- Risk: All `axios` calls are unauthenticated (no `Authorization` header, no interceptor, no credentials). Backend state (game/lineup/plays) is mutated by anonymous POSTs.
- Files: `src/stores/gameStore.js`, `src/stores/teamStore.js`
- Current mitigation: None in the client.
- Recommendations: If the backend requires protection, add an axios instance with auth interceptors; if it is intentionally open (local sim), document that assumption.

## Performance Bottlenecks

**Sequential awaits in `fetchGameData`:**
- Problem: `fetchGame`, `fetchPlayTypes`, and play-result fetches run strictly one after another, even though the first two are independent.
- Files: `src/stores/gameStore.js` (lines 304-318)
- Cause: `await` chained rather than parallelized (contrast `src/views/GameView.vue:25` which correctly uses `Promise.all`).
- Improvement path: Run independent requests with `Promise.all`; keep the play-result fetch last if it depends on updated state.

**Sequential player fetches:**
- Problem: `fetchPlayers` awaits `players/away` fully before starting `players/home`.
- Files: `src/stores/teamStore.js` (lines 31-53)
- Cause: Two independent GETs serialized.
- Improvement path: `Promise.all([...])` both requests.

## Fragile Areas

**Whole-object `gameState` replacement from server payload:**
- Files: `src/stores/gameStore.js` (lines 351-357, `updateGameStateFromPlayResult`)
- Why fragile: `gameState.value = { ...playResult.new_state }` trusts the server to always return the full shape defined at lines 13-23. A partial `new_state` silently drops fields (e.g., `first_down_target`) that the UI (`GameLayout.vue`) then reads as `undefined`.
- Safe modification: Merge into the existing state (`{ ...gameState.value, ...new_state }`) or validate the shape before assigning.
- Test coverage: None.

**Play-flow gating via `lineupSubmitted` boolean:**
- Files: `src/stores/gameStore.js` (lines 37, 43-45, 250), `src/components/GameLayout.vue` (lines 47, 52)
- Why fragile: A single mutable flag gates "Run Play". It is reset inside `runPlay`'s success branch (line 250) but not on error, so partial failures can leave the UI in an inconsistent enabled/disabled state.
- Safe modification: Derive submission readiness from actual lineup/play state rather than a manually toggled flag.
- Test coverage: None.

**No axios timeout or interceptors:**
- Files: `src/stores/gameStore.js`, `src/stores/teamStore.js`
- Why fragile: Requests use the bare global `axios` with no timeout; a hung backend leaves `isRunningPlay`/`isSubmittingPlay` spinners stuck indefinitely until the browser gives up.
- Safe modification: Create a shared `axios.create({ baseURL, timeout })` instance.

## Scaling Limits

**In-memory-only play history:**
- Current capacity: `playResults` grows unbounded in the Pinia store for the session.
- Limit: Long games accumulate every play object in memory; `fetchAllPlayResults` also replaces the array wholesale on each full sync.
- Scaling path: Cap retained history or page it; rely on the backend for the authoritative full log.

## Dependencies at Risk

**Build toolchain a major version behind:**
- Risk: `vite@^4`, `@vitejs/plugin-vue@^4`, `@vue/eslint-config-prettier@^8`, and `eslint@^8` are all one major behind current (Vite 5/6, ESLint 9 flat config).
- Impact: Security patches and ecosystem plugins increasingly target the newer majors; upgrades will require config migration (ESLint flat config in particular).
- Migration plan: Plan a dedicated toolchain-upgrade phase; migrate `.eslintrc.cjs` to flat config when moving to ESLint 9.

## Missing Critical Features

**No automated tests:**
- Problem: Zero test files (`*.test.*` / `*.spec.*`) exist and no test runner (vitest/jest) is in `devDependencies`. The `.gitignore` references `coverage/` and `cypress/` dirs but neither is set up.
- Blocks: Safe refactoring of the duplicated store methods, the fragile state-merge logic, and the polling logic — all noted above — cannot be verified without tests.

**No CI pipeline:**
- Problem: No `.github/workflows` or other CI config detected.
- Blocks: Lint/build are not enforced on changes; regressions can land unnoticed.

## Test Coverage Gaps

**Entire store layer untested:**
- What's not tested: All async API methods, error branches, `play_counter` dedup logic, and `updateGameStateFromPlayResult` merging.
- Files: `src/stores/gameStore.js`, `src/stores/teamStore.js`
- Risk: Silent regressions in game-state handling and play history; error-handling branches (the copy-pasted try/catch blocks) have never been exercised.
- Priority: High

**Game logic modules untested:**
- What's not tested: `SPFMetadata` box/position lookups and `TeamData` player assignment logic — the domain core.
- Files: `src/game/SPFMetadata.js`, `src/game/TeamData.js`, `src/game/playOutcome.js`
- Risk: Incorrect box/position mappings surface only as wrong UI without detection.
- Priority: Medium

**Component behavior untested:**
- What's not tested: Play-flow gating, error snackbar surfacing, offense/defense side derivation.
- Files: `src/components/GameLayout.vue`, `src/components/PlayResult.vue`, `src/views/GameView.vue`
- Risk: UI state inconsistencies (e.g., stuck loading, stale disabled buttons) ship unnoticed.
- Priority: Medium

---

*Concerns audit: 2026-07-13*
