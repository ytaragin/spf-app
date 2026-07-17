# Phase 4: Component Tests - Context

**Gathered:** 2026-07-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Mount key Vue SFCs with the full Vuetify + jsdom environment (from Phase 1) and seeded Pinia state (using Phase 3's factories), proving that presentation components render correctly from store state without any source refactor. Two components in scope: `PlayResult.vue` (outcome rendering) and `PlayTypeSelector.vue` (interaction/flow with store).

</domain>

<decisions>
## Implementation Decisions

### PlayResult.vue coverage (CMP-01)
- **D-01:** Cover all `classifyOutcome` branches from `src/game/playOutcome.js` (touchdown, turnover, incomplete, etc.), reusing Phase 2's `playOutcome.test.js` expectations as the source of truth for expected color/icon/label per outcome.
- **D-02:** Also test the empty state — component renders nothing (`v-if="playResult"` guard) when the store has no `playResult` yet.

### Second component pick (CMP-02)
- **D-03:** Use `PlayTypeSelector.vue` (91 lines) as the interaction/flow component. It renders a `v-btn-toggle` bound to `gameStore.getPlayTypes` / `getNextPlayType` and calls `gameStore.setPlayType()` on selection — small, clear, store-driven interaction surface.
- **D-04:** `GameLayout.vue` and the `PlaySelectors/` components were considered but deferred — GameLayout is a heavier orchestrator (194 lines, composes FootballField/PlayLineup/PlayHistory) and is a better fit for Phase 5 E2E coverage rather than isolated component mounting.

### Store seeding / mocking strategy
- **D-05:** Seed a real Pinia store (`createPinia()` + `setActivePinia`) using Phase 3's factories (`buildGameState`, `buildPlayer`, etc.) and mock `axios` at the boundary — matching the Phase 3 store-suite approach. Do NOT `vi.mock('@/stores/gameStore')` — component tests should exercise real store wiring, not stubbed getters/actions.
- **D-06:** For `PlayTypeSelector.vue`, mock `axios.get`/`axios.post` for `fetchPlayTypes`/`setPlayType` the same way Phase 3's `gameStore.test.js` does, so the component's `onMounted` fetch and click-triggered action both resolve realistically.

### Vuetify mounting
- **D-07:** Mount with the real `createVuetify()` plugin instance from `test/setup.js` (Phase 1) — no component stubbing (`stubs: { 'v-card': true }` etc.). This satisfies CMP-03's "mounts cleanly with the Vuetify plugin" requirement and catches real prop-application bugs (e.g., icon/color not applied) that stubs would hide.

### the agent's Discretion
- Exact `@vue/test-utils` mount options (e.g., `global.plugins`, `attachTo`) and how to structure per-outcome test cases (loop vs. individual `it` blocks) are left to the planner/executor — no strong preference expressed.
- Whether to co-locate factories for outcome fixtures inside `test/factories/` (extending Phase 3's factories) or inline them in the component test file is left to the agent, provided CMP-04's reuse goal is respected.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Testing conventions & recommended patterns
- `.planning/codebase/TESTING.md` — Testing patterns doc: recommends `@vue/test-utils` + jsdom + Vuetify stubbing/plugin for component mounts, co-location naming (`<Name>.test.js`), and lists `PlayResult.vue` as the top component test target (§ "Highest-Value Test Targets", item 3).

### Prior phase context (patterns to carry forward)
- `.planning/phases/03-store-unit-tests/03-CONTEXT.md` — Establishes the `vi.mock('axios')` + fresh Pinia per test pattern, and the `err.response ? err.response.data : err.message` error-extraction pattern used across store actions; also documents that `test/factories/` (`gameState.js`, `lineup.js`, `players.js`) already exist and should be reused here (CMP-04).
- `.planning/phases/02-domain-unit-tests/02-CONTEXT.md` and `src/game/playOutcome.test.js` — Source of truth for expected `classifyOutcome`/`outcomeColor` outputs per outcome type; component tests should assert consistent outputs, not re-derive the classification logic.

### Known tech debt (do not "fix" while testing)
- `.planning/ISSUES.md` — Documents pre-existing bugs in `SPFMetadata.js` (duplicate `code: 'IR'`, `getBoxLabel` lowercase mismatch) that are out of scope to fix; not directly relevant to Phase 4 components but the same "test current behavior, don't fix" discipline applies if similar oddities surface in `PlayResult.vue` or `PlayTypeSelector.vue`.

### Roadmap requirements
- `.planning/REQUIREMENTS.md` — CMP-01, CMP-02, CMP-03 (component test requirements) and CMP-04 (factory reuse) live here; `.planning/ROADMAP.md` Phase 4 section is the authoritative success-criteria list.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `test/setup.js` (Phase 1) — registers `createVuetify()` and jsdom shims (ResizeObserver, matchMedia, CSS.supports); component tests mount using this plugin instance, not ad-hoc stubs.
- `test/factories/` (Phase 3) — `buildGameState`, `buildLineup`, `buildPlayer`, `buildRoster` factories are directly reusable for seeding Pinia state in component tests (CMP-04 requires this).
- `src/game/playOutcome.js` (tested in Phase 2) — `classifyOutcome`, `outcomeColor` are the pure functions `PlayResult.vue` wraps in `computed`; component tests assert the wiring, not the logic itself.

### Established Patterns
- Store access pattern: components call `useXStore()`, then `storeToRefs(store)` for reactive state, and call actions directly (`gameStore.setPlayType(...)`) — component tests should seed/observe state through the store, not via direct prop injection where the component doesn't accept props.
- `PlayResult.vue` uses `v-if="playResult"` as its top-level render guard — the empty state is a real render path, not implicit.
- `PlayTypeSelector.vue` has an `onMounted` hook calling `gameStore.fetchPlayTypes()` and a `watch` on computed `playTypes` for auto-select-when-single-option behavior — axios mocking must account for both the mount-time fetch and any watched updates.

### Integration Points
- New files (co-located, per Phase 1 convention): `src/components/PlayResult.test.js`, `src/components/PlayTypeSelector.test.js`.
- Reused: `test/factories/*.js` (Phase 3), `test/setup.js` (Phase 1), `axios` mocking pattern (Phase 3).

</code_context>

<specifics>
## Specific Ideas

No specific UI/visual references beyond what's already implemented — the goal is testing current rendering behavior, not changing it. All four gray-area decisions above were the "Recommended" option in each case; no deviation from suggested defaults.

</specifics>

<deferred>
## Deferred Ideas

- **GameLayout.vue full-flow component test** — considered for CMP-02 but deferred; better suited to Phase 5 (End-to-End Tests) where the full play flow is exercised against a real/mocked backend rather than isolated component mounting.

### Reviewed Todos (not folded)

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 4-Component Tests*
*Context gathered: 2026-07-17*
