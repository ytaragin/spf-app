# Stack Research

**Domain:** Automated testing for a Vue 3 + Vite + Pinia + Vuetify SPA (unit / store / component / E2E)
**Researched:** 2026-07-13
**Confidence:** HIGH (all versions and peer constraints verified against the live npm registry)

## TL;DR (read this first)

The idiomatic 2025/2026 stack is **Vitest + @vue/test-utils + happy-dom + @vitest/coverage-v8** for unit/store/component, and **@playwright/test** for E2E. That part is uncontroversial.

**The one real decision this project must make: the current Vite `^4.4.6` is too old for any currently-maintained Vitest.** Verified peer/dependency constraints:

| Vitest major | Bundled `vite` dependency | Supports Vite 4? |
|--------------|---------------------------|------------------|
| 4.x (latest, 4.1.10) | `^6 \|\| ^7 \|\| ^8` | ❌ |
| 3.x (3.2.7) | `^5 \|\| ^6 \|\| ^7` | ❌ |
| 2.x (2.1.9) | `^5` | ❌ |
| 1.x (1.6.1) | `^5` | ❌ |
| 0.34.x (EOL) | `^3 \|\| ^4 \|\| ^5` | ✅ (but ancient, do not use) |

**Prescription: upgrade Vite 4 → 6 as a prerequisite, then install Vitest 4.** This is a small, safe bump (Vite 6 keeps Node ^18/^20/>=22 support, matching the Node 20 devcontainer) and unblocks the entire modern test toolchain. Do NOT pin to an EOL Vitest 0.34 to preserve Vite 4 — that trades a 30-minute upgrade for a permanently dead dependency.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `vitest` | `^4.1.10` | Test runner for unit, store, and component tests | Reuses the project's Vite config/transform pipeline (same `esbuild`, same `resolve.alias`, same plugins) so `<script setup>` SFCs and the `@`→`src` alias "just work". The default choice for Vue 3 + Vite in 2025/2026. |
| `@vue/test-utils` | `^2.4.11` | Mount/interact with Vue 3 components in tests | Official Vue component testing library; `mount`/`shallowMount` with `global.plugins` is exactly the seam needed to register Vuetify + Pinia. `2.x` is the Vue 3 line. |
| `happy-dom` | `^20.10.6` | DOM environment for component tests | Faster and lighter than jsdom for typical component tests, and (unlike jsdom 29) has no Node ≥20.19 floor. Set `environment: 'happy-dom'` in Vitest. See jsdom fallback note below. |
| `@vitest/coverage-v8` | `^4.1.10` | Coverage reporting (report-only) | V8 native coverage — no instrumentation overhead, matches the project's "report-only, no threshold" requirement. Version is lockstep-pinned to Vitest (peer `vitest: 4.1.10`), so keep them on the same version. |
| `@playwright/test` | `^1.61.1` | End-to-end browser testing (mocked + real backend) | Modern default for new Vue/Vite projects: fast, parallel, auto-wait, trace viewer, and first-class request interception via `page.route()` for the hermetic mocked-API mode. Node ≥18. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `jsdom` | `^26.1.0` | Alternative DOM environment | Fallback if a Vuetify component behaves differently under happy-dom (rare, but Vuetify's measurement/`ResizeObserver` code occasionally needs jsdom fidelity). Use `26.x` not `29.x` to stay on Node ≥18 (jsdom 29 requires Node ≥20.19). |
| `@vitest/ui` | `^4.1.10` | Browser UI for the test runner | Optional DX nicety for watch-mode; pinned lockstep to Vitest. Skip if you only run headless. |
| `@pinia/testing` | `^1.0.2` | `createTestingPinia()` for component tests | Use in **component** tests to auto-mock store actions and set initial state. NOT needed for pure store unit tests (use real `createPinia()` + `vi.mock('axios')` there). |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vitest globals | Avoid importing `describe/it/expect` in every file | Set `test.globals: true`; the existing `TESTING.md` examples assume this. |
| Playwright `webServer` | Auto-start Vite dev server for E2E | Configure `webServer.command: 'npm run dev'` + `reuseExistingServer` so `playwright test` boots the app itself. |

## Prerequisite Upgrade (do this before installing test deps)

```bash
# Bump Vite 4 -> 6 and matching Vue plugins (verified peer: vite ^5||^6||^7)
npm install -D vite@^6.4.3 @vitejs/plugin-vue@^6.0.7 @vitejs/plugin-vue-jsx@^5.1.6
```

- Vite 6 engines: Node `^18 || ^20 || >=22` — matches the Node 20 devcontainer with no Node bump required.
- Vite 7 is also viable but requires Node `^20.19 || >=22.12`; only choose it if the devcontainer Node is pinned ≥20.19. **Vite 6 is the safer target for a plain `:20` image.**
- After the bump, verify the app still builds/dev-runs (`npm run build`, `npm run dev`) before adding tests. This is the only change to app tooling; no source refactor.

## Installation (test stack)

```bash
# Unit / store / component
npm install -D vitest@^4.1.10 @vue/test-utils@^2.4.11 happy-dom@^20.10.6 @vitest/coverage-v8@^4.1.10

# Component-test store helper (optional but recommended)
npm install -D @pinia/testing@^1.0.2

# E2E (installs the runner; then download browsers)
npm install -D @playwright/test@^1.61.1
npx playwright install chromium

# Optional jsdom fallback env + runner UI
npm install -D jsdom@^26.1.0 @vitest/ui@^4.1.10
```

Suggested `package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage",
"test:e2e": "playwright test",
"test:e2e:real": "PW_MODE=real playwright test"
```

## Configuration Snippets

### 1. Vitest config reusing the Vite `@`→`src` alias + DOM env

Prefer a single `vite.config.js` with a `test` block (via the `vitest/config` `defineConfig`) so the alias/plugins are shared by construction — no duplication:

```js
// vite.config.js
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config' // <- vitest/config, not 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'happy-dom', // 'jsdom' fallback if a Vuetify component needs it
    globals: true,
    setupFiles: ['./tests/setup.js'], // registers Vuetify globally (below)
    // Keep Playwright's own specs out of Vitest's glob:
    exclude: ['**/node_modules/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // report-only: intentionally NO thresholds
    },
  },
})
```

> If you prefer a separate `vitest.config.js`, use `mergeConfig(viteConfig, defineConfig({ test: {...} }))` to inherit the alias. The single-file approach above is simpler for this project.

### 2. Register Vuetify (createVuetify) in component tests

Vuetify components fail to resolve unless a `createVuetify()` instance is provided via `global.plugins`. Centralize it in a setup helper:

```js
// tests/vuetify.js
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export const vuetify = createVuetify({ components, directives })
```

```js
// tests/setup.js  (Vuetify needs ResizeObserver, which happy-dom/jsdom lack)
import { vi } from 'vitest'
globalThis.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn(),
}))
// jsdom-only: happy-dom already implements matchMedia; guard for both:
if (!globalThis.matchMedia) {
  globalThis.matchMedia = () => ({
    matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  })
}
```

```js
// component test
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { vi } from 'vitest'
import { vuetify } from '../../tests/vuetify.js'
import PlayResult from '@/components/PlayResult.vue'

const wrapper = mount(PlayResult, {
  global: {
    plugins: [vuetify, createTestingPinia({ createSpy: vi.fn })],
  },
})
```

### 3. Mock axios (pure store unit tests) + `import.meta.env`

```js
// src/stores/gameStore.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import axios from 'axios'
import { useGameStore } from '@/stores/gameStore'

vi.mock('axios') // auto-mocks axios.get/post/etc.

beforeEach(() => setActivePinia(createPinia()))

it('records error on failed lineup submit', async () => {
  axios.post.mockRejectedValueOnce({ response: { data: 'bad lineup' } })
  const store = useGameStore()
  await store.setLineup({}, false)
  expect(store.error).toContain('bad lineup')
})
```

Mock `import.meta.env` values with `vi.stubEnv` (preferred over reassigning `import.meta.env`):

```js
import { vi, afterEach } from 'vitest'
vi.stubEnv('VITE_API_BASE_URL', 'http://test.local/api')
afterEach(() => vi.unstubAllEnvs())
```

> Note: real store code reads `import.meta.env.VITE_API_BASE_URL` at module init. If a store captures the URL at import time, set the stub in a `setupFiles` entry (or a top-level `vi.stubEnv` before importing the store) so the value is present when the module evaluates.

### 4. Playwright config for a Vite dev server + mocked vs real backend

```js
// playwright.config.js
import { defineConfig } from '@playwright/test'

const REAL = process.env.PW_MODE === 'real'

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:5173', trace: 'on-first-retry' },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    // In real mode, point the app at a live backend via env:
    env: REAL ? { VITE_API_BASE_URL: process.env.API_BASE_URL } : {},
  },
})
```

Route mocking (hermetic default) vs real backend, keyed off the same flag:

```js
// e2e/run-play.spec.js
import { test, expect } from '@playwright/test'

const REAL = process.env.PW_MODE === 'real'

test('runs a play and shows the result', async ({ page }) => {
  if (!REAL) {
    // Intercept backend calls -> deterministic responses (no backend needed)
    await page.route('**/api/**', (route) =>
      route.fulfill({ json: { result_type: 'Complete', result: 8 } }),
    )
  }
  await page.goto('/game')
  await page.getByRole('button', { name: /run play/i }).click()
  await expect(page.getByText(/complete/i)).toBeVisible()
})
```

- **Mocked mode (default, `npm run test:e2e`):** `page.route()` fulfills all `**/api/**` requests → fully hermetic, no backend, fast, deterministic. This is the CI-friendly path even though CI is out of scope this milestone.
- **Real mode (`npm run test:e2e:real`):** no route interception; the dev server is started with a real `VITE_API_BASE_URL`. Truest signal, but depends on backend availability. Match the mock URL glob (`**/api/**`) to the app's actual request paths.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| happy-dom | jsdom (`^26`) | If a specific Vuetify component's layout/measurement logic misbehaves under happy-dom. jsdom is higher-fidelity but slower; keep it as a per-file `// @vitest-environment jsdom` override rather than the global default. |
| @vue/test-utils | @testing-library/vue | If the team prefers user-centric queries (`getByRole`) over wrapper APIs. It layers on top of test-utils; adds a dependency for little gain on a small suite. test-utils is the lower-level, official baseline. |
| Vite 6 upgrade | Vite 7 upgrade | If the devcontainer Node is (or can be) pinned to ≥20.19. Vite 7 is fine but adds a Node floor for no functional benefit here. |
| createTestingPinia (component tests) | real createPinia + vi.mock('axios') | Use real Pinia for **store unit tests** (you want the real action logic + mocked transport). Use testing-pinia for **component tests** where you want to stub actions and assert they were called. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Jest | Requires babel/ts transforms and a separate config that duplicates Vite's; SFC + ESM + `import.meta.env` handling is painful. Not idiomatic for Vite projects. | Vitest |
| Cypress (E2E) | Heavier, slower, weaker parallelism and network-mocking ergonomics than Playwright; not the current default for new Vue/Vite projects. | @playwright/test |
| Vitest 0.34.x (to keep Vite 4) | EOL, unmaintained, misses years of Vue/Vite fixes. Freezes you on a dead runner to avoid a trivial Vite bump. | Upgrade Vite→6, use Vitest 4 |
| jsdom `^29` | Requires Node ≥20.19; the `:20` devcontainer may be below that, causing install/runtime failures. | jsdom `^26` (Node ≥18) or happy-dom |
| Mismatched `vitest` / `@vitest/coverage-v8` / `@vitest/ui` versions | These have exact-version peer deps on each other (`4.1.10`). Version drift = peer-dep errors. | Keep all `@vitest/*` + `vitest` on the same version |

## Stack Patterns by Variant

**If the devcontainer Node is a plain `:20` (possibly < 20.19):**
- Use Vite **6**, happy-dom (or jsdom **26**). Avoids every Node-≥20.19 floor. **← this project's default.**

**If Node is pinned ≥ 20.19 / on 22:**
- Vite 7 + jsdom 29 are both available; still no strong reason to prefer them over the Vite 6 baseline.

**If Vuetify component tests prove flaky under happy-dom:**
- Add `// @vitest-environment jsdom` at the top of just those spec files; keep happy-dom global.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `vitest@4.1.10` | `vite@^6 \|\| ^7 \|\| ^8` | **Blocks Vite 4** — the reason for the prerequisite upgrade. Engines: Node ^20/^22/>=24. |
| `vite@6.4.3` | Node `^18 \|\| ^20 \|\| >=22` | Safe target for a Node 20 devcontainer. |
| `@vitejs/plugin-vue@6.0.7` | `vue@^3.2.25`, `vite@^5 \|\| ^6 \|\| ^7` | Upgrade alongside Vite. |
| `@vitest/coverage-v8@4.1.10` | `vitest@4.1.10` (exact) | Keep lockstep with vitest. |
| `@vue/test-utils@2.4.11` | `vue@3.x` | Correct line for Vue 3. |
| `jsdom@29` | Node `^20.19 \|\| ^22.13 \|\| >=24` | Avoid unless Node ≥20.19; use jsdom 26 otherwise. |
| `@playwright/test@1.61.1` | Node `>=18` | Independent of the Vite/Vitest chain; safe. |

## Sources

- npm registry (`npm view <pkg> version|peerDependencies|dependencies|engines`), 2026-07-13 — verified live versions and peer/dependency constraints for vitest (0.34/1/2/3/4), @vue/test-utils, @vitest/coverage-v8, happy-dom, jsdom (26 & 29), @playwright/test, vite (5/6/7), @vitejs/plugin-vue(-jsx). **Confidence: HIGH.**
- Local `package.json` + `npm ls vite` — confirmed project resolves to `vite@4.5.14` and Node 20 devcontainer, establishing the upgrade requirement. **Confidence: HIGH.**
- `.planning/codebase/TESTING.md` / `STACK.md` — existing analysis of test targets, alias, Vuetify plugin requirement. **Confidence: HIGH.**

---
*Stack research for: automated testing of a Vue 3 + Vite + Pinia + Vuetify SPA*
*Researched: 2026-07-13*
