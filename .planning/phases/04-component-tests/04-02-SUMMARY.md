---
phase: 04-component-tests
plan: 02
subsystem: testing
tags: [vitest, vue-test-utils, vuetify, pinia, component-testing]

requires:
  - phase: 03-store-unit-tests
    provides: gameStore test patterns (vi.mock('axios'), setActivePinia/createPinia per-test)
  - phase: 04-component-tests
    provides: createTestVuetify() usage pattern and mountX() helper convention established in PlayResult.test.js (plan 01)
provides:
  - PlayTypeSelector.vue component test suite covering onMounted fetch, rendered play-type buttons, click-triggered setPlayType dispatch, and the nextPlayType chip
affects: [04-component-tests, future component-test phases reusing createTestVuetify]

tech-stack:
  added: []
  patterns:
    - "Component tests mount with real createTestVuetify() + real Pinia instance passed explicitly via global.plugins — zero stubs"
    - "Store state driven through real onMounted lifecycle + mocked axios.get/axios.post, asserting both the fetch side (onMounted) and the dispatch side (click handler) of the same component"

key-files:
  created: [src/components/PlayTypeSelector.test.js]
  modified: []

key-decisions:
  - "Used axios.get.mockResolvedValue / axios.post.mockResolvedValue (not mockResolvedValueOnce) in beforeEach since onMounted's fetchPlayTypes() and any watcher-driven reads must all resolve consistently across the mount lifecycle"
  - "Located the 'Pass' button via wrapper.findAll('button') text matching rather than relying on assumed CSS class names, matching Vuetify's actual rendered v-btn-toggle markup"
  - "Asserted the axios.post call shape (url, body='Pass', headers: {'Content-Type': 'text/plain'}) exactly matching gameStore.setPlayType()'s real implementation"
  - "Bound assertions to the same useGameStore() instance retrieved after mount (active pinia), never a separate/unrelated store instance (D-05)"

patterns-established:
  - "PlayTypeSelector.test.js: mountSelector() helper mirroring PlayResult.test.js's mountPlayResult() pattern for interaction/flow components needing onMounted fetch + click-dispatch coverage"

requirements-completed: [CMP-02, CMP-03]

duration: 20min
completed: 2026-07-17
status: complete
---

# Phase 4 Plan 2: PlayTypeSelector.vue Component Tests Summary

**PlayTypeSelector.vue component test suite proving onMounted fetchPlayTypes(), rendered play-type buttons, click-triggered setPlayType() dispatch, and the nextPlayType chip all work against a real Pinia store with mocked axios, under the real Vuetify plugin with zero stubbing.**

## Performance

- **Duration:** ~20 min
- **Tasks:** 1 completed
- **Files modified:** 1 created

## Accomplishments
- Created `src/components/PlayTypeSelector.test.js` with 4 passing tests
- Verifies `axios.get` is called for the `onMounted` `gameStore.fetchPlayTypes()` call and that both fetched play types ('Run', 'Pass') render as buttons
- Verifies the "Next Play Type" chip renders the fetched `nextPlayType` ('Run')
- Verifies clicking the 'Pass' button calls `gameStore.setPlayType('Pass')`, which triggers `axios.post` with the exact URL/body/headers shape from `gameStore.js`, and that `gameMsg` reflects the mocked response — asserted against the same store instance bound to the mount's active Pinia (D-05)
- Verifies zero unresolved-component/missing-inject console warnings on mount (CMP-03)
- All mounts use `createTestVuetify()` via `global.plugins`, real Pinia seeded only through the component's own `onMounted`/click flow and mocked axios — no `vi.mock('@/stores/gameStore')`, no direct field mutation, no `stubs` option anywhere in the file

## Verification

```
npx vitest run src/components/PlayTypeSelector.test.js
```
- Exit code: 0
- 1 test file, 4 tests, all passed

```
npx prettier --check src/components/PlayTypeSelector.test.js
```
- All matched files use Prettier code style (no semicolons, single quotes, 2-space indent, print width 100, no trailing commas)

```
npx eslint src/components/PlayTypeSelector.test.js
```
- No errors reported

## Deviations from Plan

None — plan executed exactly as written.

## Task Commits

1. **Task 1: PlayTypeSelector.vue component test suite (CMP-02, CMP-03)** - `3d374c6` (test)

**Plan metadata:** pending (this commit)

## Self-Check: PASSED
- FOUND: src/components/PlayTypeSelector.test.js
- FOUND: 3d374c6
