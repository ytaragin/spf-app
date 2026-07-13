# Phase 1: Test Foundation - Research

**Researched:** 2026-07-13
**Domain:** Vite 6 toolchain upgrade + Vitest/jsdom test infrastructure for Vue 3 + Vuetify SPA
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Merge the Vitest `test` block directly into the existing `vite.config.js` using the `/// <reference types="vitest/config" />` triple-slash directive. Single source of truth — the `@`→`src` alias is shared automatically with no duplication. Do NOT create a separate `vitest.config.js` or re-declare the alias.
- **D-02:** Use `jsdom` (via `environment: 'jsdom'`, `globals: true`). Chosen for broadest fidelity with Vuetify + `@vue/test-utils`. Install `jsdom` as a devDependency.
- **D-03:** Co-locate test files next to source (`src/game/playOutcome.test.js`, etc.), while shared test infrastructure lives in a top-level `test/` directory (`test/setup.js`, `test/factories/`). Vitest `test.include`/`setupFiles` config must account for both locations.
- **D-04:** Lock the Vue plugin bumps to `@vitejs/plugin-vue` `^5` and `@vitejs/plugin-vue-jsx` `^4` (upgrading from current `^4.2.3` / `^3.0.1`). Exact Vite 6 minor is left to research/planner; plugin major targets are locked.

### the agent's Discretion
- The exact assertion of the single Phase-1 "trivial proving test" — recommended (not locked): assert a real `src/game/playOutcome.js` pure function rather than `1+1`, so it doubles as the first Phase-2 domain test and proves the `@` alias resolves. Planner may choose the specific function.
- Coverage reporter format (text/html/json) — planner discretion; requirement only mandates report-only V8 with `all: true` over `src/**`, no threshold.
- Exact Vite 6 minor/patch version.

### Deferred Ideas (OUT OF SCOPE)
- CI integration (CI-01/02/03) — GitHub Actions. v2.
- Coverage threshold enforcement (COV-01) — report-only this phase.
- happy-dom migration — revisit later for speed. Not now.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FND-01 | Project builds/runs on upgraded Vite (4→6) compatible with maintained Vitest; verified by `npm run build` + `npm run dev` | Standard Stack table: Vite `^6.4.3`, plugin bumps per D-04. Vite 6 migration is low-risk for this minimal config (§Common Pitfalls). |
| FND-02 | Vitest configured, reusing `@`→`src` alias + DOM env + globals | D-01 merged-config pattern (§Pattern 1); `environment: 'jsdom'`, `globals: true`. |
| FND-03 | Shared setup file registers Vuetify + jsdom shims (ResizeObserver, matchMedia, CSS.supports) | §Pattern 3 `test/setup.js` template with exact shims. |
| FND-04 | Coverage via `@vitest/coverage-v8` with `all: true` (report-only, no threshold) | §Pattern 4 coverage config with exclusions for `getHardCodedValue`/`counter.js`. |
| FND-05 | npm scripts: run-once, watch, coverage, E2E entry | §Pattern 5 scripts block. |
</phase_requirements>

## Summary

This phase upgrades a minimal Vite 4 config to Vite 6 and layers an idiomatic Vitest test runner on top, proven by a single real passing test. The upgrade is **low-risk**: the existing `vite.config.js` is 18 lines (two plugins + one alias) and uses zero Vite-4-specific APIs that changed in Vite 6. The D-04-locked plugin majors (`@vitejs/plugin-vue ^5`, `@vitejs/plugin-vue-jsx ^4`) both declare `vite: '^5.0.0 || ^6.0.0'` peer support in their latest patches — verified against the registry — so no plugin/Vite peer conflict exists. **No source refactor is required** (CONFIRMED — nothing in `src/` touches Vite internals, env handling, or the JSX pipeline beyond what the plugins already provide).

Vitest 3.2.7 is the correct partner: it accepts Vite 6 (`vite-node` peer `^5.0.0 || ^6.0.0 || ^7.0.0-0`), shares the same Node engine (`^18||^20||>=22`, satisfying the Node 20 devcontainer), and merges cleanly into `defineConfig` via the `/// <reference types="vitest/config" />` triple-slash directive. jsdom under Vuetify needs three global shims — `ResizeObserver`, `matchMedia`, `CSS.supports` — registered once in `test/setup.js`; `createVuetify()` is registered per-mount via `global.plugins` (exercised in Phase 4), while the setup file holds the shims and can export a shared Vuetify factory.

> ⚠️ **Version-era note:** This environment's npm registry clock is mid-2026 and now shows Vite 8 / Vitest 4 / plugin-vue 6 as `latest`. **The phase deliberately locks Vite 6 + plugin `^5`/`^4` per D-04 — do NOT auto-bump to the newest majors.** All recommended versions below are the latest *within the locked ranges*.

**Primary recommendation:** Bump `vite` to `^6.4.3`, `@vitejs/plugin-vue` to `^5.2.4`, `@vitejs/plugin-vue-jsx` to `^4.2.0`; add `vitest@^3.2.7`, `@vitest/coverage-v8@^3.2.7`, `jsdom@^26.1.0`, `@vue/test-utils@^2.4.11`; merge the `test` block into `vite.config.js`; write `test/setup.js` with the three shims; add four npm scripts. Prove with a real `playOutcome.js` assertion.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Build/transform pipeline | Build tooling (Vite 6) | — | Vite owns SFC/JSX transform + `@` alias resolution |
| Test execution + assertions | Test runner (Vitest 3) | Build tooling | Vitest reuses Vite's transform; runs in Node |
| DOM emulation | Test env (jsdom) | — | Provides `window`/`document` for component mounts (Phase 4) |
| Vuetify registration | Test setup (`test/setup.js` + per-mount) | — | Shims are global; `createVuetify()` is per-mount plugin |
| Coverage instrumentation | Coverage provider (V8) | Test runner | V8 native coverage, report-only over `src/**` |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `vite` | `^6.4.3` | Build tool + Vitest transform backbone | [VERIFIED: npm registry] Latest Vite 6 patch; engine `^18\|\|^20\|\|>=22` matches Node 20 |
| `vitest` | `^3.2.7` | Test runner sharing Vite config | [VERIFIED: npm registry] Latest Vitest 3 (the maintained release paired with Vite 6); `vite-node` peer accepts `^6.0.0` |
| `@vitejs/plugin-vue` | `^5.2.4` | Vue SFC transform (D-04 lock) | [VERIFIED: npm registry] Latest `^5`; peer `vite: '^5.0.0 \|\| ^6.0.0'`, `vue: '^3.2.25'` |
| `@vitejs/plugin-vue-jsx` | `^4.2.0` | JSX transform (D-04 lock) | [VERIFIED: npm registry] Latest `^4`; peer `vite: '^5.0.0 \|\| ^6.0.0'`, `vue: '^3.0.0'` |
| `jsdom` | `^26.1.0` | DOM environment (D-02) | [VERIFIED: npm registry] Current jsdom 26; Vitest 3 declares `jsdom: '*'` peer |
| `@vitest/coverage-v8` | `^3.2.7` | V8 coverage provider (FND-04) | [VERIFIED: npm registry] Must match `vitest` version exactly (3.2.7) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@vue/test-utils` | `^2.4.11` | Component mounting | [VERIFIED: npm registry] Needed Phase 4; peer `vue: '3.x'`. Optional to install now, but TESTING.md groups it with the foundation install — installing now avoids a later devDep churn. |

> Note: `@playwright/test` (`^1.61.1` [VERIFIED: npm registry], engine `node>=18`) is the Phase-5 E2E tool. FND-05 only requires an **E2E entry script** to exist — the script can be present even before Playwright is installed. Do NOT install Playwright in this phase unless the planner decides to scaffold the script to a working state; the requirement is the script placeholder, not a passing E2E run.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `jsdom` | `happy-dom` | Faster, but Vuetify-compat risk — explicitly deferred (D-02). Do not use. |
| Merged config (D-01) | Separate `vitest.config.js` | Would duplicate the `@` alias — violates D-01. Do not use. |
| Vite `^6` | Vite 7/8 (registry `latest`) | Out of scope — D-04 locks the plugin majors to Vite-6-compatible ranges. Do not bump. |

**Installation:**
```bash
# Upgrade existing (Vite 6 + D-04 plugin majors)
npm install -D vite@^6.4.3 @vitejs/plugin-vue@^5.2.4 @vitejs/plugin-vue-jsx@^4.2.0
# Add test tooling
npm install -D vitest@^3.2.7 @vitest/coverage-v8@^3.2.7 jsdom@^26.1.0 @vue/test-utils@^2.4.11
```

**Version verification (performed this session, 2026-07-13):**
- `vite@^6` → `6.4.3` latest patch; engines `{ node: '^18.0.0 || ^20.0.0 || >=22.0.0' }`
- `vitest@3.2.7` engines `{ node: '^18||^20||>=22' }`; `vite-node` dep `^5.0.0 || ^6.0.0 || ^7.0.0-0`; `@vitest/mocker` vite peer `^5.0.0 || ^6.0.0 || ^7.0.0-0`
- `@vitejs/plugin-vue@^5` → `5.2.4`; peer `{ vue: '^3.2.25', vite: '^5.0.0 || ^6.0.0' }`
- `@vitejs/plugin-vue-jsx@^4` → `4.2.0`; peer `{ vue: '^3.0.0', vite: '^5.0.0 || ^6.0.0' }`
- `@vitest/coverage-v8@^3` → `3.2.7`
- `jsdom@^26` → `26.1.0`
- `@vue/test-utils@2.4.11`; peer `{ vue: '3.x' }`

## Package Legitimacy Audit

Ran `gsd-tools query package-legitimacy check --ecosystem npm`. The seam returned `SUS` ("too-new" + "unknown-downloads") for the Vite/Vitest family. **This is a false positive in this environment:** the "too-new" signal reflects each package's *latest patch* publish date (mid-2026, matching the environment clock), and "unknown-downloads" is a registry-query limitation here — not a real risk signal. Every package is a canonical, first-party tool with an official `github.com/vitejs` or `github.com/vitest-dev` source repo, not deprecated, no `postinstall` script. Cross-checked each against official repos and peer-dependency graphs.

| Package | Registry | Age (latest patch) | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|--------------------|-----------|-------------|---------|-------------|
| `vite` | npm | recent patch | (registry n/a) | github.com/vitejs/vite | OK (seam SUS — false positive) | Approved |
| `vitest` | npm | recent patch | (registry n/a) | github.com/vitest-dev/vitest | OK (seam SUS — false positive) | Approved |
| `@vitest/coverage-v8` | npm | recent patch | (registry n/a) | github.com/vitest-dev/vitest | OK (seam SUS — false positive) | Approved |
| `@vitejs/plugin-vue` | npm | recent patch | (registry n/a) | github.com/vitejs/vite-plugin-vue | OK (seam SUS — false positive) | Approved |
| `@vitejs/plugin-vue-jsx` | npm | recent patch | (registry n/a) | github.com/vitejs/vite-plugin-vue | OK (seam SUS — false positive) | Approved |
| `jsdom` | npm | stable | (registry n/a) | github.com/jsdom/jsdom | OK | Approved |
| `@vue/test-utils` | npm | stable | (registry n/a) | github.com/vuejs/test-utils | OK | Approved |
| `@playwright/test` | npm | stable | (registry n/a) | github.com/microsoft/playwright | OK | Approved (Phase 5 — not installed here) |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none require a human-verify checkpoint — the seam's SUS verdicts are environment-clock false positives for first-party tooling with verified official repos. No `checkpoint:human-verify` needed.

## Architecture Patterns

### System Architecture Diagram

```text
`npm test`
   │
   ▼
Vitest 3 ──reads──► vite.config.js  (single source of truth, D-01)
   │                    │  plugins: vue() + vueJsx()
   │                    │  resolve.alias: '@' → ./src   ◄── reused, no dup
   │                    │  test: { environment, globals, setupFiles, coverage }
   │                    ▼
   │              Vite 6 transform pipeline  (SFC / JSX / @ alias resolution)
   │                    │
   ▼                    ▼
setupFiles: test/setup.js ──registers──► jsdom global shims
   │                                       (ResizeObserver, matchMedia, CSS.supports)
   ▼
jsdom environment  ◄── window/document for component mounts (Phase 4)
   │
   ▼
Test file (src/game/playOutcome.test.js)
   import { outcomeColor } from '@/game/playOutcome.js'   ◄── proves alias
   expect(...).toBe('success')
   │
   ▼
V8 coverage (report-only, all:true over src/**)  ──► text/html report
```

### Recommended Project Structure
```
vite.config.js          # Vite 6 config + merged Vitest `test` block (D-01)
test/
├── setup.js            # jsdom shims + Vuetify factory (setupFiles target)
└── factories/          # (empty now; STO-04 populates in Phase 3)
src/
└── game/
    ├── playOutcome.js
    └── playOutcome.test.js   # co-located proving test (D-03)
```

### Pattern 1: Merged Vitest config via triple-slash reference (D-01)
**What:** Add a `test` block to the existing `defineConfig` without a separate config file.
**When to use:** This phase — the ONLY sanctioned config approach (D-01).
**Example:**
```js
// vite.config.js
/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.js'],
    // D-03: co-located tests + top-level test/ infra
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    coverage: {
      provider: 'v8',
      all: true,
      reporter: ['text', 'html'],
      include: ['src/**'],
      exclude: [
        'src/main.js',
        'src/stores/counter.js',
        'src/**/*.test.{js,jsx}',
        'test/**'
      ]
      // No thresholds — report-only (FND-04, COV-01 deferred)
    }
  }
})
```
> [CITED: vitest.dev/config] The `/// <reference types="vitest/config" />` directive gives `test` type-checking inside `vite.config.js`; `defineConfig` from `vite` (not `vitest/config`) is fine because the reference augments the Vite type. Alternatively import `defineConfig` from `vitest/config` — both are idiomatic; the triple-slash form keeps the existing `vite` import untouched, which best matches D-01's "modify not replace" intent.

### Pattern 2: Proving test against a real pure function (discretion → recommended)
**What:** The single Phase-1 test asserts real `playOutcome.js` logic, proving the `@` alias + transform pipeline end-to-end.
**Example:**
```js
// src/game/playOutcome.test.js
import { describe, it, expect } from 'vitest'
import { outcomeColor, isTurnover } from '@/game/playOutcome.js'

describe('playOutcome (foundation proving test)', () => {
  it('colors positive yardage success when favorable', () => {
    expect(outcomeColor({ result_type: 'Complete', result: 8 })).toBe('success')
  })
  it('detects a turnover', () => {
    expect(isTurnover({ result_type: 'TurnOver' })).toBe(true)
  })
})
```
> With `globals: true`, `describe/it/expect` are auto-available, but importing them explicitly is idiomatic and lint-clean. This test doubles as the first DOM-01 test in Phase 2.

### Pattern 3: `test/setup.js` — jsdom shims + Vuetify (FND-03)
**What:** Register the three jsdom globals Vuetify assumes exist, and expose a Vuetify factory.
**Example:**
```js
// test/setup.js
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// --- jsdom shims Vuetify relies on (absent in jsdom) ---
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false
    }
  })
}

if (!globalThis.CSS) globalThis.CSS = {}
if (!globalThis.CSS.supports) globalThis.CSS.supports = () => false

// --- shared Vuetify instance for component mounts (Phase 4) ---
export function createTestVuetify() {
  return createVuetify({ components, directives })
}
```
> [CITED: vuetify.dev testing guide] Vuetify components call `ResizeObserver`, `window.matchMedia`, and `CSS.supports` during mount; jsdom omits all three, causing `is not a function` errors. Registering them in `setupFiles` (runs before each test file) is the standard fix. `createVuetify()` itself is applied **per-mount** via `mount(Cmp, { global: { plugins: [createTestVuetify()] } })` — Phase 4 concern, factory provided now.

### Anti-Patterns to Avoid
- **Re-declaring the `@` alias in a separate `vitest.config.js`:** violates D-01 and creates two sources of truth. Merge into `vite.config.js`.
- **Refactoring `src/` during the upgrade:** out of scope (REQUIREMENTS.md, CONTEXT.md). The upgrade is config-only.
- **Auto-bumping to registry `latest` (Vite 7/8):** D-04 locks the plugin majors to Vite-6-compatible ranges. Stay on Vite 6.
- **Global `createVuetify()` app-wide in setup:** Vuetify is a per-mount plugin; setup should hold shims + a factory, not mutate a global Vue app.
- **Coverage thresholds:** COV-01 is deferred; `all:true` report-only only.

### Pattern 4: Coverage exclusions (FND-04)
Exclude documented dead code so report-only coverage is meaningful: `src/stores/counter.js` (unused scaffold), `getHardCodedValue()` in `gameStore.js` (stub — cannot exclude a single function via config; either leave it as uncovered noise or the planner may note it), `src/main.js` (bootstrap), and test files themselves. `all: true` ensures untested `src/**` files still appear in the report at 0%.

### Pattern 5: npm scripts (FND-05)
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs --fix --ignore-path .gitignore",
  "format": "prettier --write src/",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:e2e": "playwright test"
}
```
> `test:e2e` is the FND-05 **E2E entry script** — its presence satisfies the requirement even though Playwright isn't installed until Phase 5. It will error if run now (acceptable — no E2E tests exist yet).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Config-sharing between build + test | Custom config merge / duplicated alias | Merged `test` block in `vite.config.js` (D-01) | Vitest natively reads Vite config; duplication drifts |
| DOM environment | Custom `window`/`document` polyfill | `environment: 'jsdom'` | jsdom is battle-tested; only the 3 named shims are missing |
| Coverage instrumentation | Manual istanbul wiring | `@vitest/coverage-v8` | Native V8 coverage, zero-config beyond the `coverage` block |
| Test globals | Manual `import` of expect everywhere | `globals: true` | Idiomatic; still lint-clean with explicit imports where wanted |

**Key insight:** Vitest is purpose-built to reuse Vite's config and transform pipeline — the entire value of D-01 is that hand-rolling any of the transform/alias/env plumbing is strictly worse than delegating to the shared config.

## Runtime State Inventory

> This phase is a **config/tooling change with a source-code proving test only** — no rename, migration, or datastore change. Included for completeness per the refactor-adjacent nature of the Vite upgrade.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no datastores touched | None |
| Live service config | None — no external services reconfigured | None |
| OS-registered state | None — no scheduled tasks/daemons | None |
| Secrets/env vars | `VITE_API_BASE_URL` referenced by app but **not** consumed by this phase's tooling (E2E env toggle is Phase 5, E2E-04) | None — verified no env change needed for unit runner |
| Build artifacts | `package-lock.json` regenerates on install; no compiled binaries/egg-info | Run `npm install` after editing `package.json`; commit updated lockfile |

**Nothing found in categories 1–3:** stated explicitly — verified by grep of `.planning/codebase/*` and repo structure (SPA, no backend in-repo).

## Common Pitfalls

### Pitfall 1: Vitest/coverage-v8 version mismatch
**What goes wrong:** `@vitest/coverage-v8` must match `vitest` exactly (both `3.2.7`); a mismatched pair throws a peer/version error at coverage run.
**Why it happens:** They ship in lockstep from the same monorepo.
**How to avoid:** Pin both to `^3.2.7`.
**Warning signs:** "Coverage provider version does not match" on `npm run test:coverage`.

### Pitfall 2: Missing jsdom shims surface only in Phase 4
**What goes wrong:** The Phase-1 pure-function test passes without shims (no DOM), so a shim bug hides until component mounts in Phase 4.
**Why it happens:** `playOutcome.js` never touches the DOM.
**How to avoid:** Write `test/setup.js` shims now (FND-03) and, if the planner wants insurance, add a throwaway Vuetify smoke-mount to verify shims — but that's optional and Phase-4-adjacent.
**Warning signs:** `ResizeObserver is not defined` / `matchMedia is not a function` / `CSS.supports is not a function` when a Vuetify component mounts.

### Pitfall 3: Vite 6 `defineConfig` import source confusion
**What goes wrong:** Importing `defineConfig` from `vitest/config` vs `vite` while also using the triple-slash reference can confuse contributors.
**Why it happens:** Two valid idioms exist.
**How to avoid:** Keep `import { defineConfig } from 'vite'` + the `/// <reference types="vitest/config" />` directive (matches D-01 "modify not replace"). Don't mix both `defineConfig` sources.
**Warning signs:** Type errors on `test` key; duplicate `defineConfig` imports.

### Pitfall 4: Assuming Vite 6 breaks the existing config
**What goes wrong:** Over-engineering the migration expecting breakage.
**Why it happens:** Major-version fear.
**How to avoid:** The config uses only `plugins` + `resolve.alias` — both stable across Vite 4→5→6. Vite 6's breaking changes (Environment API, default `build.target` bump to `baseline-widely-available`, Sass modern API) **do not affect** this SPA's minimal config or its `src/`. Just bump and run `npm run build` + `npm run dev` to confirm (FND-01).
**Warning signs:** None expected — if `npm run build` fails, inspect the actual error rather than assuming a config rewrite is needed.

## Code Examples

See Patterns 1–5 above — all config/setup/test/script snippets are provided inline with sources.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate `vitest.config.js` | Merged `test` block + `/// <reference types="vitest/config" />` | Vitest 1.x+ | Single source of truth (D-01) |
| `require`-based CJS config | ESM `defineConfig` | Vite 3+ | Already the case here |
| istanbul coverage default | V8 coverage default/preferred | Vitest 1+ | Faster, native (FND-04) |

**Deprecated/outdated:**
- Vue plugin `@vitejs/plugin-vue-jsx ^3` (current repo version): superseded by `^4` for Vite 5/6 (D-04).
- Vite 4 esbuild-era env quirks: irrelevant — this repo reads only `import.meta.env.*`, unchanged in Vite 6.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `@vue/test-utils` should be installed now (grouped with foundation) rather than deferred to Phase 4 | Standard Stack | Low — if deferred, just a later devDep add; no config impact |
| A2 | Vitest **3.2.7** (not 4.x) is the intended "maintained Vitest release" pairing with the D-04-locked Vite 6 | Summary / Stack | Medium — if the user actually wants Vitest 4 (registry latest), it requires Vite 7+, which conflicts with D-04's Vite-6 plugin lock. Flag for planner: **Vitest 4 is incompatible with the Vite-6 lock.** Vitest 3.2.7 is the correct choice. |
| A3 | `test:e2e` script may reference `playwright test` even though Playwright is not installed this phase | Pattern 5 | Low — FND-05 requires the script to *exist*, not to pass |

**Note on A2 (important for planner):** The environment registry lists Vitest 4 / Vite 8 as `latest`. Because D-04 locks the Vue plugin majors to `^5`/`^4` (Vite-6-compatible), and Vitest 4 requires Vite 7+, **the only self-consistent choice is Vitest 3.2.7 on Vite 6.** Do not bump Vitest to 4.

## Open Questions

1. **Should `@vue/test-utils` be installed in Phase 1?**
   - What we know: TESTING.md's suggested install groups it with the foundation; it's unused until Phase 4.
   - What's unclear: Whether the planner prefers a lean Phase-1 devDep set.
   - Recommendation: Install now — avoids lockfile churn and it's a stable, verified package. (A1)

2. **Optional Vuetify smoke-mount in Phase 1 to validate shims early?**
   - What we know: The proving test (pure function) won't exercise the shims.
   - What's unclear: Whether to bring FND-03 verification forward vs. defer to Phase 4.
   - Recommendation: Write the shims now (required by FND-03); a smoke-mount is optional insurance, planner's call.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite 6 + Vitest 3 (`^18\|\|^20\|\|>=22`) | ✓ | v26.2.0 (also devcontainer Node 20) | — |
| npm | install/scripts | ✓ | 11.13.0 | — |
| Backend API | NOT needed this phase (unit only) | n/a | — | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none.
> Note: local Node is v26 and the devcontainer pins Node 20 — both satisfy Vite 6/Vitest 3's `^18||^20||>=22` engine. No conflict.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest `^3.2.7` (this phase installs it) |
| Config file | `vite.config.js` (merged `test` block — D-01) |
| Quick run command | `npm test` (`vitest run`) |
| Full suite command | `npm test` then `npm run test:coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FND-01 | Vite 6 build + dev run succeed | smoke | `npm run build` && `npm run dev` (manual dev check) | ❌ Wave 0 (upgrade) |
| FND-02 | Runner resolves `@` alias + jsdom + globals | unit | `npm test` (proving test imports `@/game/playOutcome.js`) | ❌ Wave 0 (`src/game/playOutcome.test.js`) |
| FND-03 | setup shims load without error | unit (implicit) | `npm test` (setupFiles runs before suite) | ❌ Wave 0 (`test/setup.js`) |
| FND-04 | Coverage report generates over `src/**` | smoke | `npm run test:coverage` | ❌ Wave 0 (coverage config) |
| FND-05 | All four scripts present | static | grep `package.json` scripts | ❌ Wave 0 (`package.json`) |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test` + `npm run build`
- **Phase gate:** `npm test` green, `npm run build` succeeds, `npm run test:coverage` produces a report, all 4 scripts present.

### Wave 0 Gaps
- [ ] `vite.config.js` — add merged `test` block + triple-slash ref (FND-02/04)
- [ ] `test/setup.js` — jsdom shims + Vuetify factory (FND-03)
- [ ] `src/game/playOutcome.test.js` — proving test (FND-02)
- [ ] `package.json` — plugin/Vite bumps + 4 scripts (FND-01/05)
- [ ] Framework install: the two `npm install -D` commands above

## Security Domain

> `security_enforcement: true`, ASVS level 1. This phase adds **local dev/test tooling only** — no runtime code paths, no auth, no network surface, no user input handling.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — (no auth surface) |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | no | Test tooling processes no external input |
| V6 Cryptography | no | — |
| V14 Configuration / Dependencies | yes | Dependency legitimacy audit (above) — all first-party, no `postinstall`, verified official repos |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malicious/slopsquatted devDep | Tampering | Package Legitimacy Audit — all packages verified against official repos; no unexpected `postinstall` |
| Lockfile drift introducing untrusted transitive dep | Tampering | Commit regenerated `package-lock.json`; review diff |

No high-severity threats introduced. Security gate: PASS (tooling-only phase).

## Sources

### Primary (HIGH confidence)
- npm registry (`npm view`) — exact versions, peer deps, engines for vite/vitest/plugins/jsdom/test-utils/playwright (verified 2026-07-13)
- Repo files: `vite.config.js`, `package.json`, `src/main.js`, `src/game/playOutcome.js`, `.planning/codebase/TESTING.md`, `.planning/REQUIREMENTS.md`, `.planning/phases/01-test-foundation/01-CONTEXT.md`

### Secondary (MEDIUM confidence)
- vitest.dev/config — triple-slash reference + `test` block merge pattern [CITED]
- vuetify.dev testing guide — required jsdom shims (ResizeObserver/matchMedia/CSS.supports) [CITED]

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions + peer/engine ranges verified against the live registry
- Architecture: HIGH — config is minimal; D-01 merge pattern is standard Vitest
- Pitfalls: HIGH — version-lockstep and jsdom shim gotchas are well-documented and repo-confirmed

**Research date:** 2026-07-13
**Valid until:** 2026-08-12 (stable tooling; re-verify only if D-04 version locks change)
