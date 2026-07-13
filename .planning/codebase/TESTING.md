# Testing Patterns

**Analysis Date:** 2026-07-13

## Current State: NO TESTS

**There is currently no automated testing in this repository.** This section documents the gap and the recommended setup, since planners/executors will need this when adding tests.

Evidence:
- No test files exist — no `*.test.js`, `*.test.vue`, `*.spec.js` anywhere under `src/` or the repo root
- No test runner is installed — `package.json` `devDependencies` contains no `vitest`, `jest`, `@vue/test-utils`, `@testing-library/*`, `cypress`, or `playwright`
- No test config file — no `vitest.config.js`, `jest.config.*`, `cypress.config.*`, or `playwright.config.*`
- No `test` script in `package.json` (`scripts` are only `dev`, `build`, `preview`, `lint`, `format`)
- No CI workflow directory (`.github/workflows`) present

## Recommended Framework (for when tests are added)

Given the Vite + Vue 3 stack, the idiomatic choice is **Vitest** (shares Vite's config/transform pipeline) plus **@vue/test-utils** for component mounting.

**Suggested install:**
```bash
npm i -D vitest @vue/test-utils jsdom @vitest/coverage-v8
```

**Suggested `package.json` scripts:**
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

**Suggested Vitest config** — reuse the existing `@` → `src` alias from `vite.config.js` and add:
```js
test: {
  environment: 'jsdom',   // required to mount Vue components
  globals: true
}
```

## Recommended Test File Organization

No convention is established yet. Recommended (matches Vitest defaults + Vue ecosystem norms):
- **Co-locate** unit tests next to source: `src/game/playOutcome.test.js`, `src/stores/gameStore.test.js`
- Component tests beside SFCs: `src/components/PlayResult.test.js`
- Naming: `<Name>.test.js`

## Highest-Value Test Targets (priority order)

1. **`src/game/playOutcome.js`** — pure, dependency-free functions (`isTurnover`, `netYards`, `outcomeColor`, `outcomeSummary`, `classifyOutcome`, `managedTeamHadPossession`). Trivial to test, high logic density, no mocking needed. **Start here.**
2. **`src/stores/gameStore.js`** — Pinia setup store with axios calls and error-handling branches. Requires mocking `axios` and a fresh Pinia instance per test.
3. **`src/components/PlayResult.vue`** and other components — require `@vue/test-utils` + jsdom + Vuetify stubbing.

## Recommended Patterns

**Pure-function unit test (no mocks needed):**
```js
import { describe, it, expect } from 'vitest'
import { outcomeColor, isTurnover } from '@/game/playOutcome.js'

describe('outcomeColor', () => {
  it('is success for positive yardage when favorable', () => {
    expect(outcomeColor({ result_type: 'Complete', result: 8 })).toBe('success')
  })
  it('inverts when the managed team is defending', () => {
    expect(outcomeColor({ result_type: 'TurnOver' }, { favorable: false })).toBe('success')
  })
})
```

**Pinia store test (fresh store + mocked axios):**
```js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import axios from 'axios'
import { useGameStore } from '@/stores/gameStore'

vi.mock('axios')

beforeEach(() => setActivePinia(createPinia()))

it('sets error on failed lineup submit', async () => {
  axios.post.mockRejectedValueOnce({ response: { data: 'bad lineup' } })
  const store = useGameStore()
  await store.setLineup({}, false)
  expect(store.error).toContain('bad lineup')
  expect(store.isSubmittingLineup).toBe(false) // finally resets flag
})
```

**Component test (Vuetify requires a plugin instance):**
- Mount with `@vue/test-utils` `mount(Component, { global: { plugins: [vuetify, pinia] } })`
- Vuetify components need `createVuetify()` registered in `global.plugins` or they will fail to resolve

## Mocking Guidance

- **Mock:** `axios` (all network in `gameStore.js` / `teamStore.js`), `import.meta.env.VITE_API_BASE_URL` if needed
- **Do NOT mock:** the pure functions in `src/game/playOutcome.js` — test them directly

## Coverage

- **None enforced.** No coverage tooling installed and no thresholds configured.
- Recommended: `@vitest/coverage-v8`, view with `npm run test:coverage`.

## Manual / Existing Verification

Current quality gates are limited to static checks:
- `npm run lint` — ESLint (with `--fix`)
- `npm run format` — Prettier
- `npm run build` — Vite production build (catches import/compile errors)

There is no unit, integration, or E2E test layer.

---

*Testing analysis: 2026-07-13*
