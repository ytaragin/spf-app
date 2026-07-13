# Architecture Research

**Domain:** Automated test infrastructure for a Vue 3 + Vite + Pinia SPA (backend-authoritative)
**Researched:** 2026-07-13
**Confidence:** HIGH

## Standard Architecture

The idiomatic Vue 3 + Vite test stack is a **two-runner architecture**: Vitest owns everything in-process (domain, store, component) sharing Vite's transform pipeline and the `@`→`src` alias; Playwright owns out-of-process browser E2E. They do not share a config file — Vitest reads `vitest.config.js` (or a `test` block in `vite.config.js`), Playwright reads `playwright.config.js`. The only thing they share is the app itself.

Within Vitest, layers form a strict **dependency cone**: the runner + config is the foundation, then three test layers of increasing setup cost stack on top. Each higher layer depends on the infrastructure of the ones below being proven to work.

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   E2E LAYER (Playwright)                     │
│   playwright.config.js  ·  e2e/*.spec.js  ·  fixtures/       │
│   ┌───────────────────────┐   ┌───────────────────────────┐ │
│   │ mocked-API mode       │   │ real-backend mode         │ │
│   │ page.route() intercept│   │ webServer: vite preview   │ │
│   │ (hermetic, default)   │   │ + VITE_API_BASE_URL       │ │
│   └───────────────────────┘   └───────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                  VITEST (single in-process runner)           │
│   vitest.config.js  ·  test/setup.js  ·  test/factories/     │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ Component     │  │ Store         │  │ Domain             │  │
│  │ @vue/test-    │  │ mocked axios  │  │ pure fns           │  │
│  │ utils+Vuetify │  │ +fresh Pinia  │  │ NO setup           │  │
│  │ +jsdom  (3)   │  │ (2)           │  │ (1) START HERE     │  │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬──────────┘  │
│         │ needs setup.js  │ needs mocks        │ needs only  │
│         └─────────────────┴────────────────────┴─ runner+cfg │
├─────────────────────────────────────────────────────────────┤
│                 FOUNDATION (must exist first)                │
│   vitest + @vue/test-utils + jsdom + @vitest/coverage-v8     │
│   config: jsdom env · globals:true · @→src alias reuse       │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Vitest config | Test discovery, jsdom env, `@`→src alias reuse, globals, setup-file registration, coverage | `vitest.config.js` importing `vite.config.js` via `mergeConfig`, or `test:` block inside `vite.config.js` |
| Global setup file | One-time per-file bootstrap: register Vuetify plugin, reset Pinia, install global mocks (`ResizeObserver`, `matchMedia`) | `test/setup.js` referenced by `setupFiles` in config |
| Fixtures / factories | Deterministic builders for game state, play results, rosters | `test/factories/*.js` — plain functions `makeGameState(overrides)`, `makePlayResult(overrides)` |
| Domain suite | Verify pure functions in `src/game/` | Co-located `*.test.js`, zero mocks, zero setup |
| Store suite | Verify Pinia stores incl. error branches | Co-located `*.test.js`, `vi.mock('axios')` + `setActivePinia(createPinia())` |
| Component suite | Verify SFC rendering/interaction | Co-located `*.test.js`, `mount(C, { global: { plugins: [vuetify, pinia] } })` |
| Playwright config | Browser matrix, `webServer`, base URL, env-driven mode switch | `playwright.config.js` |
| E2E suite | Verify core user flows end-to-end | `e2e/*.spec.js` with a route-mock helper toggled by env var |
| npm scripts | Developer entry points per layer | `test`, `test:watch`, `test:coverage`, `test:e2e`, `test:e2e:real` |

## Recommended Project Structure

```
spf-app/
├── vite.config.js              # existing — source of the @ → src alias
├── vitest.config.js            # NEW — mergeConfig(viteConfig, { test: {...} })
├── playwright.config.js        # NEW — separate runner, webServer + env switch
├── package.json                # NEW scripts: test, test:watch, test:coverage, test:e2e
├── src/
│   ├── game/
│   │   ├── playOutcome.js
│   │   ├── playOutcome.test.js       # co-located domain unit (LAYER 1)
│   │   ├── TeamData.js
│   │   ├── TeamData.test.js
│   │   └── SPFMetadata.test.js
│   ├── stores/
│   │   ├── gameStore.js
│   │   ├── gameStore.test.js         # co-located store unit, mocked axios (LAYER 2)
│   │   └── teamStore.test.js
│   └── components/
│       ├── PlayResult.vue
│       └── PlayResult.test.js        # co-located component (LAYER 3)
├── test/                             # NEW — shared Vitest infra (NOT co-located)
│   ├── setup.js                      # Vuetify plugin, Pinia reset, global mocks
│   └── factories/
│       ├── gameState.js              # makeGameState(overrides)
│       ├── playResult.js             # makePlayResult(overrides)
│       └── roster.js                 # makeRoster(overrides)
└── e2e/                              # NEW — Playwright specs (LAYER 4)
    ├── fixtures/
    │   ├── mockApi.js                # page.route() handlers for /game/*, /players/*
    │   └── responses/*.json          # canned backend responses (reuse factories where possible)
    └── play-flow.spec.js
```

### Structure Rationale

- **Co-locate unit/component `*.test.js` next to source** — matches Vitest defaults and Vue ecosystem norms; the test travels with the file it verifies, easy to find, easy to delete together. This is the established convention for in-process tests.
- **`test/` for shared infra only** — setup files and factories are cross-cutting, not tied to one source file, so they live in a dedicated root dir. Do not co-locate factories.
- **`e2e/` separate from `src/`** — Playwright specs are not transformed by Vite the same way and must be *excluded* from Vitest's discovery (`test.exclude` or `include` scoped to `src/**`). A separate top-level dir makes that boundary trivial and prevents Vitest from trying to run `.spec.js` browser tests in jsdom.
- **`vitest.config.js` via `mergeConfig`** — reuses the existing `@`→src alias and Vue plugin from `vite.config.js` without duplication (the hard constraint from PROJECT.md). Keeping it a separate file (vs. inlining into `vite.config.js`) keeps test concerns out of the build config.

## Architectural Patterns

### Pattern 1: Config reuse via mergeConfig

**What:** Derive `vitest.config.js` from the existing Vite config so the `@` alias, Vue plugin, and env handling are inherited, not re-declared.
**When to use:** Always, in a Vite project that already has a working `vite.config.js`.
**Trade-offs:** One extra import; avoids alias drift that silently breaks `@/...` imports in tests.

```js
// vitest.config.js
import { mergeConfig } from 'vite'
import { defineConfig } from 'vitest/config'
import viteConfig from './vite.config.js'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.js'],
    include: ['src/**/*.test.js'],
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: { provider: 'v8', reporter: ['text', 'html'] }, // report-only
  },
}))
```

### Pattern 2: Shared setup file for Vuetify + Pinia + global mocks

**What:** A single `setupFiles` module registers the Vuetify plugin factory, resets Pinia per test, and polyfills browser globals jsdom lacks (`ResizeObserver`, `matchMedia`) that Vuetify touches.
**When to use:** Required the moment component tests enter the picture; harmless for earlier layers.
**Trade-offs:** Global setup can hide per-test intent; keep it to genuinely universal concerns and pass the Vuetify instance explicitly in `mount(...)` rather than auto-installing, so component tests stay readable.

```js
// test/setup.js
import { beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

global.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} }
window.matchMedia ??= () => ({ matches: false, addEventListener(){}, removeEventListener(){} })

beforeEach(() => setActivePinia(createPinia()))
```
```js
// in a component test — Vuetify passed explicitly, not globally auto-installed
import { createVuetify } from 'vuetify'
const vuetify = createVuetify()
mount(PlayResult, { global: { plugins: [vuetify] }, props: { result: makePlayResult() } })
```

### Pattern 3: Factory functions for game state (not static JSON blobs)

**What:** Expose `makeGameState(overrides)` / `makePlayResult(overrides)` that return a valid default deep-merged with per-test overrides.
**When to use:** As soon as store or component tests need realistic `gameState`; also feed E2E mock responses.
**Trade-offs:** Slightly more code than inline literals, but a schema change updates one factory instead of dozens of tests. Because the backend is authoritative and `gameState` is replaced wholesale from `new_state`, tests need whole valid snapshots constantly — factories pay off immediately.

```js
// test/factories/playResult.js
export const makePlayResult = (o = {}) => ({ result_type: 'Complete', result: 8, ...o })
```

### Pattern 4: Env-toggled E2E — page.route mock vs. real backend

**What:** A single spec suite runs in two modes. Default (hermetic) installs `page.route()` handlers that fulfill `/game/*`, `/players/*`, `/offense/*`, `/defense/*` from canned JSON. Real mode skips the mock and points `webServer`/base URL at a live `VITE_API_BASE_URL`. An env var (e.g. `E2E_MODE=mock|real`) selects behavior.
**When to use:** Backend-authoritative apps where mocked = fast/deterministic (default, CI-friendly) and real = truest integration signal.
**Trade-offs:** Two code paths to keep in sync; mitigate by generating mock responses from the same factories the unit layer uses. HAR replay is an alternative to hand-written routes but adds a recording/maintenance step — hand-written `page.route` is simpler for a small, known API surface.

```js
// e2e/fixtures/mockApi.js
export async function installMockApi(page) {
  await page.route('**/players/**', r => r.fulfill({ json: makeRoster() }))
  await page.route('**/game/play', r => r.fulfill({ json: { new_state: makeGameState() } }))
}
// e2e/play-flow.spec.js
test('run a play', async ({ page }) => {
  if (process.env.E2E_MODE !== 'real') await installMockApi(page)
  await page.goto('/')
  // ...drive the flow, assert rendered result
})
```
```js
// playwright.config.js — webServer only needed; real backend supplied via env
export default defineConfig({
  webServer: { command: 'npm run preview', url: 'http://localhost:4173', reuseExistingServer: true },
  use: { baseURL: 'http://localhost:4173' },
})
```

## Data Flow

### Test Execution Flow

```
npm run test           →  Vitest  →  jsdom  →  src/**/*.test.js  (layers 1–3, in-process)
npm run test:e2e       →  Playwright (mock) →  vite preview  →  page.route intercept
npm run test:e2e:real  →  Playwright (real) →  live app       →  VITE_API_BASE_URL backend
```

### Dependency / Build Order (STRICT)

```
[0] Runner + config + alias        ← nothing works until this exists
      ↓
[1] Domain unit  (src/game/)       ← needs ONLY [0]; no mocks, no setup
      ↓
[2] Store unit   (mocked axios)    ← needs [0]; adds vi.mock(axios) + fresh Pinia
      ↓
[3] Component    (@vue/test-utils) ← needs [0] + setup.js (Vuetify/Pinia/globals)
      ↓
[4] E2E          (Playwright)      ← separate runner + config; app must run; mock helper then real toggle
```

- **[0] is the hard gate.** No test of any layer runs before the runner, jsdom env, alias reuse, and a `test` script exist. This is why the runner+config is its own foundational unit of work, not folded into the domain phase.
- **[1] domain** depends on [0] and nothing else — it is deliberately the first *test* layer because it needs zero mocking infrastructure.
- **[2] store** introduces the axios-mock + Pinia-reset pattern. It reuses factories that are worth building here.
- **[3] component** is the first layer that *requires* `test/setup.js` (Vuetify plugin + global polyfills). Do not attempt component tests before setup.js is proven.
- **[4] E2E** is fully independent of the Vitest cone (different runner/config) but should come last because it is slowest, flakiest, and delivers signal already partially covered by [1]–[3]. Build **mock mode first** (hermetic, no backend dependency), then add the **real-backend toggle**.

### Which layer delivers value earliest

**Domain unit (layer 1) delivers the most value per unit of effort, immediately.** `src/game/playOutcome.js` is pure, dependency-free, high logic density, and needs no mocks — a green suite here on day one proves the runner works AND locks down the highest-risk pure logic. It is the correct "start here" target and also the smallest possible proof that the foundation ([0]) is sound.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (small app, 3 domain modules, 2 stores, ~20 SFCs) | Single Vitest config, co-located tests, hand-written page.route mocks — all sufficient |
| Growth (more stores/flows) | Introduce Vitest `projects` to split `unit` vs `component` runs; add MSW if mocking spreads beyond E2E into component tests |
| CI adoption (out of scope now) | Add GitHub Actions running `test` + `test:e2e` (mock mode only in CI); gate real-backend E2E behind a manual/nightly job |

### Scaling Priorities

1. **First bottleneck: component-test setup sprawl.** As SFC count grows, ad-hoc Vuetify/mount boilerplate multiplies — consolidate into a `mountWithVuetify()` helper in `test/`.
2. **Second bottleneck: mock/real E2E drift.** Divergence between canned responses and the real API — fix by sourcing both from shared factories and running real-mode E2E periodically.

## Anti-Patterns

### Anti-Pattern 1: One config trying to run both Vitest and Playwright

**What people do:** Point Vitest `include` at `e2e/*.spec.js`, or let Playwright pick up `src/**/*.test.js`.
**Why it's wrong:** Vitest runs in jsdom/node and will crash on Playwright's `page` fixture; the runners have incompatible test contexts.
**Do this instead:** Keep separate configs; scope Vitest `include` to `src/**/*.test.js` and `exclude` `e2e/**`; keep Playwright `testDir: 'e2e'`.

### Anti-Pattern 2: Building component tests before the setup file exists

**What people do:** Jump to mounting SFCs, hit "unknown custom element `v-card`" or `ResizeObserver is not defined`, then thrash.
**Why it's wrong:** Vuetify needs a plugin instance and jsdom lacks browser globals Vuetify uses — these are foundation, not per-test concerns.
**Do this instead:** Follow the dependency order — prove `test/setup.js` (Vuetify + global polyfills) works, then write component tests.

### Anti-Pattern 3: Static JSON fixtures copy-pasted per test

**What people do:** Inline large `gameState` literals in every store/component/E2E test.
**Why it's wrong:** Backend-authoritative snapshots are large and change together; copies drift and a schema change breaks dozens of tests.
**Do this instead:** Centralize in `test/factories/` and override per test; reuse the same factories to build E2E mock responses.

### Anti-Pattern 4: E2E real-backend as the default (or only) mode

**What people do:** Every E2E run hits a live backend.
**Why it's wrong:** Slow, flaky, requires backend availability and a valid `VITE_API_BASE_URL`, unusable in hermetic/CI runs.
**Do this instead:** Make `page.route` mock mode the default; gate real-backend behind an explicit env var / separate script.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| REST backend (`VITE_API_BASE_URL`) | E2E real mode via env var; mocked in unit (axios mock) and default E2E (page.route) | Absent/wrong URL silently breaks data flow — mock mode must require no backend at all |
| Vite preview server | Playwright `webServer` boots `npm run preview` for E2E | `reuseExistingServer` for local dev speed |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Vitest ↔ Playwright | None — separate runners, shared app only | Enforce via include/exclude + testDir |
| Test setup ↔ component tests | `setupFiles` (implicit) + explicit `global.plugins` (Vuetify) | Prefer explicit Vuetify in `mount()` for readability; keep only true globals in setup.js |
| Factories ↔ (store, component, E2E) | Direct import of `test/factories/*` | Single source of truth for game-state shape across all layers |

## Phase Ordering Implications (for roadmap)

The dependency cone maps cleanly onto phases, each a shippable increment:

1. **Phase: Test foundation** — install deps, `vitest.config.js` (alias reuse, jsdom, globals, coverage), npm scripts. *Gate for everything.* Prove with one trivial domain test.
2. **Phase: Domain unit tests** (`src/game/`) — **earliest value, start here**; no mocks, validates foundation. Depends on Phase 1.
3. **Phase: Store unit tests** — introduce axios-mock + Pinia-reset + factories. Depends on Phase 1 (Phase 2 optional but natural predecessor).
4. **Phase: Component tests** — first to require `test/setup.js` (Vuetify + globals). Depends on Phase 1 + setup file; benefits from factories from Phase 3.
5. **Phase: E2E** — separate Playwright config; **mock mode first**, then real-backend toggle. Independent runner; sequence last (slowest, some overlap with 2–4). Reuse factories for mock responses.

Phases 2–4 could parallelize once Phase 1 lands, but component (4) must not precede its setup file. E2E (5) is the natural finale.

## Sources

- Vitest — Browser Mode / projects & config (vitest.dev/guide/browser, /guide/projects) — HIGH (official, v4)
- Playwright — Mock APIs (`page.route`, HAR, webServer) (playwright.dev/docs/mock) — HIGH (official)
- Project codebase maps: `.planning/codebase/{ARCHITECTURE,STRUCTURE,TESTING}.md` — HIGH (validated repo analysis)
- `.planning/PROJECT.md` constraints (alias reuse, Vuetify plugin, dual-mode E2E, report-only coverage) — HIGH (project-authoritative)

---
*Architecture research for: Vue 3 + Vite + Pinia SPA test infrastructure*
*Researched: 2026-07-13*
