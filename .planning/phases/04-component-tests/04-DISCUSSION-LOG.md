# Phase 4: Component Tests - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-17
**Phase:** 4-Component Tests
**Areas discussed:** PlayResult scope, Second component pick, Axios mocking strategy, Vuetify stub depth

---

## PlayResult scope (CMP-01)

| Option | Description | Selected |
|--------|-------------|----------|
| All classifyOutcome branches | Cover every outcome type from playOutcome.js, reusing Phase 2's tests as source of truth | ✓ |
| Happy path + one error/edge case only | Minimal coverage, fast/small suite | |
| Also test 'no playResult yet' empty state | Verify v-if guard when store has no result | ✓ (combined) |

**User's choice:** All classifyOutcome branches + empty state (multi-select, both selected).
**Notes:** No additional clarification requested — recommended defaults accepted.

---

## Second component pick (CMP-02)

| Option | Description | Selected |
|--------|-------------|----------|
| PlayTypeSelector.vue | Small (91 lines), clear interaction, calls gameStore.setPlayType | ✓ |
| GameLayout.vue | Larger orchestrator (194 lines), heavier to mount/stub | |
| OffensePlaySelector.vue / DefensePlaySelector.vue | Smallest selectors, less representative of a "flow" | |

**User's choice:** PlayTypeSelector.vue
**Notes:** GameLayout.vue explicitly deferred to Phase 5 (E2E) rather than dropped.

---

## Axios mocking strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Seed real Pinia store + mock axios | Reuse Phase 3's approach: real store + factories, mock axios at boundary | ✓ |
| Mock the store module entirely | vi.mock the Pinia store, stub getters/actions | |

**User's choice:** Seed real Pinia store + mock axios
**Notes:** Keeps store logic exercised and factories reusable per CMP-04.

---

## Vuetify stub depth

| Option | Description | Selected |
|--------|-------------|----------|
| Real Vuetify via createVuetify() | Use existing test/setup.js plugin, mount real components | ✓ |
| Stub Vuetify components | Use `stubs: {...}` to bypass Vuetify internals | |

**User's choice:** Real Vuetify via createVuetify()
**Notes:** Matches CMP-03's explicit "mounts cleanly with Vuetify plugin" requirement.

---

## the agent's Discretion

- Exact `@vue/test-utils` mount options (`global.plugins`, `attachTo`, etc.)
- Structuring per-outcome test cases (loop vs. individual `it` blocks)
- Whether to extend `test/factories/` with outcome fixtures or inline them in the test file

## Deferred Ideas

- GameLayout.vue full-flow component test — deferred to Phase 5 (End-to-End Tests), where the full play flow will be exercised via Playwright against a mocked/real backend.
