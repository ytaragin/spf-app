# Pitfalls Research

**Domain:** Adding automated tests (Vitest + @vue/test-utils + Playwright) to a Vue 3 + Vite 4 + Vuetify + Pinia backend-authoritative SPA
**Researched:** 2026-07-13
**Confidence:** HIGH (core pitfalls are documented in official Vitest/Vuetify/Pinia/Playwright docs and widely-reproduced community issues; version-specific notes MEDIUM)

## Critical Pitfalls

### Pitfall 1: Mounting Vuetify components without a `createVuetify()` plugin

**What goes wrong:**
Component tests that `mount(SomeComponent)` where the SFC (or any child) uses `<v-btn>`, `<v-card>`, `<v-snackbar>`, etc. throw `Could not find injected Vuetify instance` / `Cannot read properties of undefined (reading 'global')`, or Vuetify components silently fail to resolve and render as bare custom elements. Every component in this app renders inside Vuetify (`GameLayout.vue`, `PlayResult.vue`, `GameView.vue`), so this blocks the entire component-test layer.

**Why it happens:**
Vuetify relies on Vue's `provide/inject` for its global config, theme, and display state. `@vue/test-utils` mounts in isolation without `main.js`, so the Vuetify plugin is never installed. Developers copy a "mount and assert" snippet from generic Vue testing guides that don't account for a UI framework.

**How to avoid:**
Create a shared test helper (e.g. `tests/vuetify.js`) that builds a Vuetify instance and always pass it via `global.plugins`:
```js
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
export const vuetify = createVuetify({ components, directives })
// in tests:
mount(Comp, { global: { plugins: [vuetify, createTestingPinia()] } })
```
Register the theme tokens the app defines in `main.js` if any component reads theme colors (this app centralizes domain color tokens there). Consider a global setup file so this is not re-authored per test.

**Warning signs:**
`[Vue warn]: injection "Symbol(vuetify:...)" not found`, components rendering with no styling/structure in `wrapper.html()`, or `TypeError` reading `theme`/`display`/`global`.

**Phase to address:**
Component-test setup phase (the phase that first mounts a `.vue` file). Must precede any component assertions.

---

### Pitfall 2: jsdom missing `ResizeObserver`, `CSS.supports`, `matchMedia`, and `visualViewport` (Vuetify crashes)

**What goes wrong:**
Even with the plugin installed, Vuetify components explode in jsdom with `ResizeObserver is not defined`, `window.matchMedia is not a function`, `CSS.supports is not a function`, or `visualViewport` errors. Components using overlays/menus/`v-snackbar` (the app's error snackbar) or the display/breakpoint system are the usual triggers.

**Why it happens:**
jsdom deliberately does not implement layout/observation APIs. Vuetify's display composable calls `matchMedia`; its overlay and sizing logic reference `ResizeObserver` and `CSS.supports`. These exist in real browsers but not jsdom, and Vitest's default environment is jsdom.

**How to avoid:**
Add a Vitest `setupFiles` shim that stubs these before any test runs:
```js
import { vi } from 'vitest'
global.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} }
global.CSS = { supports: () => false, escape: (s) => s }
window.matchMedia ??= vi.fn().mockImplementation((q) => ({
  matches: false, media: q, onchange: null,
  addListener: vi.fn(), removeListener: vi.fn(),
  addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
}))
```
Alternative: evaluate `happy-dom` as the environment — it implements more of these APIs out of the box — but it has its own Vuetify quirks; jsdom + explicit shims is the more predictable, better-documented path for Vuetify. Decide once and record it.

**Warning signs:**
Tests pass for pure functions but every component test throws a `ReferenceError`/`TypeError` on a browser API name; errors mention `ResizeObserver`, `matchMedia`, `CSS`, or `IntersectionObserver`.

**Phase to address:**
Vitest infra / config phase (setupFiles), before component tests.

---

### Pitfall 3: Shared Pinia state leaking between tests (no fresh instance / no `setActivePinia`)

**What goes wrong:**
Store tests pass in isolation but fail when run together, or pass/fail depending on file order. `gameStore`'s `playResults` array, `gameState`, `error`, and boolean flags (`isRunningPlay`, `lineupSubmitted`) carry over from a previous test, producing phantom passes (assertion sees stale success state) or spurious failures.

**Why it happens:**
Pinia stores are singletons keyed off the *active* Pinia instance. If you don't call `setActivePinia(createPinia())` in `beforeEach`, all tests share one store instance and its mutated state. This app's stores accumulate state (`playResults` grows unbounded, `gameState` is replaced wholesale) so leakage is especially visible.

**How to avoid:**
`beforeEach(() => setActivePinia(createPinia()))` for plain unit tests of stores. For component tests, use `@pinia/testing`'s `createTestingPinia()` (fresh per mount, actions stubbed by default — pass `stubActions: false` when you want real action logic). Never instantiate the store at module top-level.

**Warning signs:**
Tests that fail only when run as a suite, order-dependent flakiness, assertions on `store.error`/`playResults` seeing values a prior test set.

**Phase to address:**
Store-test phase; encode the `setActivePinia` pattern in the first store test and in a documented convention.

---

### Pitfall 4: `vi.mock('axios')` hoisting and default-export shape mistakes

**What goes wrong:**
`axios.post.mockRejectedValueOnce(...)` throws `axios.post is not a function` or `Cannot read properties of undefined`. Or the mock silently doesn't apply because a variable was referenced inside the factory. Since every store method uses the bare global `axios` (`axios.get`/`axios.post`), a broken mock invalidates the entire store-test layer.

**Why it happens:**
(1) `vi.mock` is **hoisted** to the top of the file — it cannot reference variables declared later (use `vi.hoisted()` if you need shared mock state). (2) `axios` is a **default export**; an auto-mock may not shape `.get/.post` as functions, and TS/ESM interop can require `mockedAxios = vi.mocked(axios)`. (3) If store code ever migrates to `axios.create()` instances (a noted tech-debt refactor), mocking the bare global stops working entirely.

**How to avoid:**
Use `vi.mock('axios')` at top of file, then in `beforeEach` reset and cast: `const mockedAxios = vi.mocked(axios, true)`. For controlled returns use `mockedAxios.post.mockResolvedValueOnce({ data: {...} })`. Assert error branches with `mockRejectedValueOnce({ response: { data: 'msg' } })` to match the app's `err.response ? err.response.data : err.message` extraction. Consider `axios-mock-adapter` or MSW for higher-fidelity request assertions. Document that if the app later adopts `axios.create()`, tests must mock the instance module instead.

**Warning signs:**
`is not a function` on axios methods, mock factory `ReferenceError: Cannot access '...' before initialization`, mocks that appear ignored (real network attempted → jsdom `Network Error`).

**Phase to address:**
Store-test phase; the axios-mock convention must be established with the first `gameStore` test.

---

### Pitfall 5: Async store actions asserted before promises flush

**What goes wrong:**
Assertions on `store.error`, `store.playResults`, or the `finally`-reset flags (`isSubmittingLineup`, `isRunningPlay`) run before the awaited axios promise and its `.then/finally` settle, so the test sees the pre-resolution state and fails intermittently — or worse, passes for the wrong reason.

**Why it happens:**
The store actions are `async` with `try/catch/finally`. Awaiting only the action call isn't always enough when there are chained microtasks, nested fetches (`fetchGameData` calls `fetchGame` + `fetchPlayTypes` + `fetchPlayResult`), or component-driven triggers. The `finally` flag reset is a separate microtask.

**How to avoid:**
Always `await store.someAction()` directly in tests. For component-driven flows, `await flushPromises()` (from `@vue/test-utils`) after triggering, and `await wrapper.vm.$nextTick()` before DOM assertions. For the `finally` flag-reset assertion pattern shown in TESTING.md, ensure the action is fully awaited. Prefer `await expect(...).resolves/.rejects` for actions that surface errors.

**Warning signs:**
Flaky flag assertions, `expect(store.error).toContain(...)` failing nondeterministically, DOM not reflecting store changes.

**Phase to address:**
Store-test phase and component-test phase.

---

### Pitfall 6: Playwright E2E flakiness — racing the authoritative backend

**What goes wrong:**
E2E tests intermittently fail: clicking "Run Play" then asserting the result appears fails because the backend round-trip (POST `/game/play` → `fetchGameData` → `updateGameStateFromPlayResult`) hasn't completed, or the polling-based `fetchPlayResult` (which only appends when `play_counter` increases) hasn't yet observed the new play. Hard waits (`waitForTimeout`) mask this and make suites slow and still flaky.

**Why it happens:**
This app is *backend-authoritative*: every state change is a network round-trip, and result history is populated by a counter-gated poll that can legitimately lag or (per known bug) drop intermediate plays. Tests written against a locally-fast dev backend race the async UI. Developers reach for arbitrary sleeps instead of web-first assertions.

**How to avoid:**
Use Playwright web-first auto-retrying assertions (`await expect(locator).toBeVisible()`, `toHaveText`) which poll until the condition holds — never `waitForTimeout`. Wait on the actual network with `page.waitForResponse(/\/game\/play/)` after the click when asserting result state. Assert on user-visible outcomes (result text/color) rather than internal store state. For the polling/`play_counter` behavior, drive the UI one play at a time in tests. Enable `trace: 'on-first-retry'` and configure `retries` in CI-less local runs sparingly (retries hide real races — prefer fixing the wait).

**Warning signs:**
Tests that pass locally but fail under load/parallelism, `waitForTimeout` sprinkled through specs, assertions on state immediately after `click()`.

**Phase to address:**
E2E phase; establish the "no hard waits, web-first assertions, wait on response" convention up front.

---

### Pitfall 7: Playwright `webServer` startup and env (`VITE_API_BASE_URL`) misconfiguration

**What goes wrong:**
E2E runs fail with connection-refused because the Vite dev/preview server wasn't up, or tests hit the wrong backend because `VITE_API_BASE_URL` was baked at build time and differs between hermetic and real-backend modes. `reuseExistingServer` misconfiguration causes stale builds or double-starts.

**Why it happens:**
Vite embeds `VITE_`-prefixed env at build/serve time (it's a public build constant, not runtime), so switching backends means switching the env before the server starts — not at test time. Playwright's `webServer` block must launch the app and wait for readiness; teams forget the `url`/`port` health gate or run against `build`+`preview` vs `dev` inconsistently.

**How to avoid:**
Configure `playwright.config.js` `webServer` with `command`, `url`, `timeout`, and `reuseExistingServer: !process.env.CI`. Because `.env`, `.env.development`, `.env.production` are committed (per CONCERNS), pick the env file explicitly per mode. For hermetic mode, point `VITE_API_BASE_URL` at a stable dummy origin and intercept all calls with `page.route()`; for real mode, set it to the live backend before server start. Keep the two modes as separate Playwright projects or a toggled config, selected by an env flag (e.g. `E2E_MODE=hermetic|real`).

**Warning signs:**
`ECONNREFUSED`/`net::ERR_CONNECTION_REFUSED`, tests hitting production/real backend when hermetic was intended, `webServer` timing out.

**Phase to address:**
E2E infra phase (config + env strategy), before writing E2E specs.

---

### Pitfall 8: Hermetic vs real-backend E2E toggling done ad-hoc (half-mocked, brittle)

**What goes wrong:**
The "mocked-API default, real-backend optional" requirement degrades into partially-mocked runs: some routes are intercepted, others leak to a real (or absent) backend, so hermetic runs still fail or give false signal. Or the real-backend mode is never actually exercised and quietly rots.

**Why it happens:**
The app makes many endpoints (`/game/*`, `/offense/*`, `/defense/*`, `/players/*`). Mocking them piecemeal with individual `page.route` calls in each test leaves gaps. Because the backend returns *authoritative new game state*, hand-authored mock fixtures must return correctly-shaped `new_state` (see fragility: partial `new_state` silently drops fields like `first_down_target`) or the UI breaks in ways that look like test bugs.

**How to avoid:**
Centralize hermetic interception in one fixture/`beforeEach` that routes *all* API paths and returns realistic full-shape payloads captured from a real backend (record once, replay). Use a single `E2E_MODE` switch: hermetic installs the route fixture; real disables it. Keep a small set of "real backend smoke" specs tagged separately so real mode is runnable but not the default gate. Validate mock `new_state` payloads carry the full shape the UI reads.

**Warning signs:**
Unrouted requests in hermetic mode (Playwright shows real network attempts), UI fields rendering `undefined`, real-mode specs that no one runs.

**Phase to address:**
E2E infra phase; the mocking strategy is a design decision, not per-test improvisation.

---

### Pitfall 9: Coverage config counts the wrong files / hides the pure-logic gap

**What goes wrong:**
Coverage reports show misleadingly high or low numbers: config files, `main.js`, generated/vendor code, and untested-but-uncounted files skew the picture; or the highest-value pure domain layer (`src/game/`) shows as "covered" only because it was imported, not asserted. Teams then think they're safe when the store error branches (never exercised, per CONCERNS) are still untested.

**Why it happens:**
`@vitest/coverage-v8` counts only files touched by tests unless `all: true` is set, so untested files vanish from the denominator (inflating %). Conversely, forgetting `include`/`exclude` counts config/scaffold (`counter.js`, `main.js`) and drags numbers down. Import-without-assert registers as line coverage.

**How to avoid:**
Set `coverage: { provider: 'v8', all: true, include: ['src/**'], exclude: ['src/main.js','src/**/*.spec.*','**/counter.js','src/router/**'] }` so untested `src` files appear at 0% and are visible. Report-only (no threshold) per the milestone decision — but read the report per-file, prioritizing `src/game/` and `gameStore.js` error branches. Don't equate line coverage with assertion coverage.

**Warning signs:**
Suspiciously high coverage % with few tests, `main.js`/config files in the report, error branches showing green with no explicit error-path test.

**Phase to address:**
Coverage-config phase (can piggyback on Vitest infra phase).

---

### Pitfall 10: `import.meta.env` / `VITE_API_BASE_URL` not stubbed, and Vitest not reusing the `@` alias

**What goes wrong:**
Store tests import `gameStore.js`, which reads `import.meta.env.VITE_API_BASE_URL` at module load; under Vitest this may be `undefined`, producing request URLs like `undefined/game/play` that confuse mock-matching or error extraction. Separately, imports like `@/stores/gameStore` fail to resolve with `Cannot find module '@/...'` because Vitest didn't inherit the Vite `@ → src` alias.

**Why it happens:**
Vitest loads env from `.env` files but the value may still be absent in the test context; `import.meta.env` is available under Vitest but not guaranteed to carry app env unless configured. The `@` alias lives in `vite.config.js`; a separate `vitest.config.js` (or non-merged config) won't automatically have it.

**How to avoid:**
Either use a single `vite.config.js` with a `test` block (aliases shared automatically) or `mergeConfig` the Vite config into `vitest.config.js` so the `@` alias is inherited (a hard requirement per PROJECT constraints). Stub env deterministically with `vi.stubEnv('VITE_API_BASE_URL', 'http://test.local')` in setup, and `vi.unstubAllEnvs()` in `afterEach`. Because axios is mocked, the URL value mostly needs to be *defined and stable* so assertions on called URLs are predictable.

**Warning signs:**
`Cannot find module '@/...'`, request URLs containing `undefined`, tests that depend on which `.env*` file happened to load.

**Phase to address:**
Vitest infra / config phase.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `waitForTimeout` sleeps in Playwright | E2E "passes" quickly | Flaky + slow suite; masks real races; erodes trust in E2E | Never — use web-first assertions / `waitForResponse` |
| Global `stubGlobal` shim without cleanup | Component tests mount | Cross-test leakage of `ResizeObserver`/`matchMedia` fakes | OK if defined once in setupFiles and consistent |
| Shallow-stubbing all Vuetify components (`global.stubs`) | Faster, avoids jsdom gaps | Tests assert against stubs, not real render; misses integration bugs | OK for logic-focused component tests; not for render/interaction tests |
| Mocking bare global `axios` | Simple store tests today | Breaks if store refactors to `axios.create()` instance | OK now; document the migration dependency |
| Hand-written mock `new_state` fixtures | Fast hermetic E2E | Drift from real backend shape; partial payloads break UI silently | OK if recorded from real backend and shape-validated |
| Testing internal store state in E2E | Easy assertions | Couples E2E to implementation; brittle | Never — assert user-visible outcomes |
| No coverage `all: true` | Higher % number | Untested files hidden; false confidence | Never for report accuracy |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Vuetify + jsdom | Assuming plugin install is enough | Also shim `ResizeObserver`/`matchMedia`/`CSS.supports` in setupFiles |
| Pinia + component tests | Using plain `createPinia()` and real actions | `createTestingPinia()`; opt into real actions per test with `stubActions:false` |
| axios (default export) + Vitest | Auto-mock leaves `.post` undefined | `vi.mocked(axios, true)` + explicit `mockResolvedValueOnce` |
| Vite env + Vitest | Expecting runtime env swap | `VITE_` env is build-time; `vi.stubEnv` in tests, choose `.env*` before Playwright `webServer` start |
| `@` alias + separate Vitest config | Alias not inherited → module-not-found | Share `vite.config.js` `test` block or `mergeConfig` |
| Playwright + backend-authoritative UI | Asserting immediately after click | `waitForResponse` + auto-retrying `expect(locator)` |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Full `mount` of every component with real Vuetify | Slow component suite | `shallowMount` or stub heavy children when only logic matters | As component count grows |
| Real-backend E2E as the default gate | Slow, network-flaky runs | Hermetic (route-mocked) default; real mode tagged/optional | Immediately for local dev loop |
| Unbounded `playResults` in long E2E games | Memory growth, slow polling waits | Keep E2E flows short; reset between tests | Long multi-play E2E scenarios |
| Re-authoring Vuetify/Pinia setup per test file | Boilerplate + slow authoring | Shared test helpers + `setupFiles` | As test file count grows |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Pointing hermetic E2E env at a real/prod backend by accident | Tests mutate real game state (unauthenticated POSTs, per CONCERNS) | Explicit `E2E_MODE` gate; hermetic points at dummy origin + full route interception |
| Committing test env/fixtures with future secrets | `.env*` already tracked in git; pattern invites leaks | Keep only public `VITE_API_BASE_URL`; add `.env*` ignore + `.env.example` (noted tech debt, out of scope but flag) |
| Recording real backend responses that contain sensitive data into committed fixtures | Data leak in repo | Sanitize recorded `new_state`/player payloads before committing fixtures |

## UX Pitfalls

_(Not applicable — this milestone adds a test layer, not user-facing UX. The only user is the developer; DX pitfalls are covered under Technical Debt and Performance Traps.)_

## "Looks Done But Isn't" Checklist

- [ ] **Vuetify component tests:** Often missing jsdom shims — verify `ResizeObserver`/`matchMedia`/`CSS.supports` are stubbed and overlay/snackbar components render.
- [ ] **Store tests:** Often missing fresh Pinia — verify `setActivePinia(createPinia())` in `beforeEach` and that suite passes when files run together (not just individually).
- [ ] **Axios error branches:** Often only happy-path tested — verify each store method's `catch` sets `error` and `finally` resets its flag (`isSubmittingLineup`, `isRunningPlay`).
- [ ] **Coverage report:** Often inflated — verify `all: true` so `src/game/` and untested store methods appear at their real (low) coverage.
- [ ] **Hermetic E2E:** Often half-mocked — verify zero real network requests escape (Playwright shows no unrouted calls) and mock `new_state` payloads carry full shape.
- [ ] **`@` alias in tests:** Verify `@/...` imports resolve under Vitest, not just under Vite build.
- [ ] **E2E waits:** Verify no `waitForTimeout` sleeps; assertions use auto-retrying locators / `waitForResponse`.
- [ ] **Real-backend E2E mode:** Verify it actually runs (not just theoretically toggled) before claiming both modes are supported.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Pinia state leakage discovered late | LOW | Add `setActivePinia` in `beforeEach`; re-run suite; fix now-exposed order-dependencies |
| Vuetify/jsdom crashes across all component tests | LOW | Add one `setupFiles` shim + shared `createVuetify` helper; all component tests unblock at once |
| Flaky E2E from hard waits | MEDIUM | Replace `waitForTimeout` with `waitForResponse` + web-first assertions per spec |
| Coverage % was inflated | LOW | Add `all: true` + `include/exclude`; re-baseline expectations |
| Half-mocked hermetic E2E | MEDIUM | Centralize route interception in one fixture with recorded full-shape payloads |
| axios mock shape wrong across store tests | LOW | Introduce `vi.mocked(axios, true)` helper; update per-test return stubs |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Missing Vuetify plugin (P1) | Component-test setup | A `<v-btn>`-containing component mounts and renders real markup |
| jsdom API gaps (P2) | Vitest infra (setupFiles) | Snackbar/overlay component test passes without `ReferenceError` |
| Pinia leakage (P3) | Store-test phase | Suite passes run-together and in randomized order |
| axios mock hoisting/shape (P4) | Store-test phase | Error-branch test sets `store.error` from `response.data` |
| Async flush (P5) | Store + component phases | `finally` flag-reset assertions stable across repeated runs |
| Backend race flakiness (P6) | E2E phase | Result assertions use `waitForResponse`/auto-retry; no `waitForTimeout` in specs |
| `webServer`/env (P7) | E2E infra phase | Hermetic and real modes each start server against intended `VITE_API_BASE_URL` |
| Hermetic/real toggling (P8) | E2E infra phase | Hermetic run shows zero unrouted network calls; real smoke specs runnable |
| Coverage config (P9) | Vitest/coverage config | Report shows `src/game/` + untested store methods at real coverage with `all:true` |
| `import.meta.env` / `@` alias (P10) | Vitest infra phase | `@/...` imports resolve; request URLs are defined/stable |

## Sources

- Vitest official docs — mocking (`vi.mock` hoisting, `vi.mocked`), `vi.stubEnv`, coverage (`all`, `include/exclude`), config merging with Vite (`mergeConfig`) — HIGH
- Vue Test Utils official docs — `global.plugins`, `flushPromises`, `createTestingPinia` (@pinia/testing) — HIGH
- Vuetify docs + widely-reproduced GitHub issues — `createVuetify` in tests; jsdom `ResizeObserver`/`matchMedia`/`CSS.supports`/`visualViewport` shims — HIGH
- Pinia official testing guide — `setActivePinia(createPinia())`, testing pinia, `stubActions` — HIGH
- Playwright official docs — web-first auto-retrying assertions, `waitForResponse`, `page.route` interception, `webServer` config, traces/retries — HIGH
- Vite env docs — `VITE_`-prefixed vars are build-time public constants — HIGH
- Project codebase maps (`.planning/codebase/TESTING.md`, `CONCERNS.md`, `ARCHITECTURE.md`) — backend-authoritative flow, `play_counter` polling bug, whole-object `new_state` replacement, committed `.env*`, Vite 4 toolchain — HIGH (repo-verified)

---
*Pitfalls research for: adding automated tests to a Vue 3 + Vite + Vuetify + Pinia backend-authoritative SPA*
*Researched: 2026-07-13*
