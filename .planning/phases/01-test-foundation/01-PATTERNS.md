# Phase 1: Test Foundation - Pattern Map

**Mapped:** 2026-07-13
**Files analyzed:** 4 (2 modified, 2 new)
**Analogs found:** 4 / 4 (2 in-repo, 2 idiomatic-Vitest — greenfield test tooling)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `vite.config.js` (modify) | config | transform / config-share | `vite.config.js` (self, current v4 form) | exact (in-repo) |
| `package.json` (modify) | config | dependency / scripts | `package.json` (self, current scripts block) | exact (in-repo) |
| `test/setup.js` (new) | test-setup | environment-shim | `src/main.js` (createVuetify registration) + idiomatic Vuetify testing guide | role-match (in-repo) + idiomatic |
| `src/game/playOutcome.test.js` (new) | test | request-response (pure fn assert) | `src/game/playOutcome.js` (test target) + idiomatic Vitest | greenfield / idiomatic |

**Greenfield note:** No test infrastructure exists in the repo (TESTING.md confirms zero tests). For the two genuinely new file types (`test/setup.js`, `*.test.js`) the analog is the idiomatic-Vitest/Vuetify pattern documented in RESEARCH.md §Patterns 2–3, anchored to real in-repo code (`src/main.js` for Vuetify, `src/game/playOutcome.js` as the assert target).

---

## Pattern Assignments

### `vite.config.js` (config, modify — merge Vitest `test` block)

**Analog:** `vite.config.js` (current form, lines 1–18) — MODIFY not replace (D-01).

**Current structure to preserve** (lines 1–18):
```js
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
```

**Changes to apply:**
- Add triple-slash directive `/// <reference types="vitest/config" />` as the FIRST line (above imports). Keep `import { defineConfig } from 'vite'` — do NOT switch to `vitest/config` (D-01 "modify not replace"; Pitfall 3).
- Keep the existing `@`→`src` alias untouched — it is reused by Vitest with zero duplication (FND-02, D-01).
- Add a `test: { ... }` key to the `defineConfig` object (RESEARCH §Pattern 1):

```js
  test: {
    environment: 'jsdom',        // D-02
    globals: true,               // D-02
    setupFiles: ['./test/setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}'],  // D-03 co-located tests
    coverage: {
      provider: 'v8',            // FND-04
      all: true,                 // report-only over src/**
      reporter: ['text', 'html'],// planner discretion
      include: ['src/**'],
      exclude: [
        'src/main.js',
        'src/stores/counter.js',
        'src/**/*.test.{js,jsx}',
        'test/**'
      ]
      // No thresholds — COV-01 deferred
    }
  }
```

**Style:** existing file uses no semicolons, single quotes, 2-space indent — match it (existing file already has a trailing comma in the plugins array; prettier config says `trailingComma: none`, so new additions must omit trailing commas per convention).

---

### `package.json` (config, modify — version bumps + scripts)

**Analog:** `package.json` (current form, lines 5–29).

**Scripts pattern** (current lines 5–11) — append four new scripts (RESEARCH §Pattern 5, FND-05):
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
> `test:e2e` is a placeholder entry script (FND-05) — Playwright is NOT installed this phase; the script only needs to exist (RESEARCH A3).

**devDependencies changes** (current lines 20–29):
- Bump `@vitejs/plugin-vue` `^4.2.3` → `^5.2.4` (D-04)
- Bump `@vitejs/plugin-vue-jsx` `^3.0.1` → `^4.2.0` (D-04)
- Bump `vite` `^4.4.6` → `^6.4.3` (FND-01)
- Add: `vitest@^3.2.7`, `@vitest/coverage-v8@^3.2.7`, `jsdom@^26.1.0`, `@vue/test-utils@^2.4.11`

Install commands (RESEARCH §Installation):
```bash
npm install -D vite@^6.4.3 @vitejs/plugin-vue@^5.2.4 @vitejs/plugin-vue-jsx@^4.2.0
npm install -D vitest@^3.2.7 @vitest/coverage-v8@^3.2.7 jsdom@^26.1.0 @vue/test-utils@^2.4.11
```
> `@vitest/coverage-v8` MUST match `vitest` exactly (both `3.2.7`) — Pitfall 1. Commit the regenerated `package-lock.json`.

---

### `test/setup.js` (test-setup, new — jsdom shims + Vuetify factory)

**Analog:** `src/main.js` lines 10–17 (createVuetify registration pattern) + idiomatic Vuetify testing guide (RESEARCH §Pattern 3, FND-03).

**Vuetify registration pattern to mirror** (from `src/main.js` lines 10–17):
```js
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
// main.js registers app-wide; setup.js exposes a per-mount FACTORY instead
```
> Do NOT copy the full theme/blueprint/icons config from `main.js` — the test factory needs only `{ components, directives }` (minimal mount). Do NOT `app.use()` globally — Vuetify is a per-mount plugin (Anti-Pattern in RESEARCH).

**Full file content** (RESEARCH §Pattern 3):
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
> Three shims required: `ResizeObserver`, `window.matchMedia`, `CSS.supports` (Pitfall 2). Style: no semicolons, single quotes, 2-space indent, no trailing commas.

---

### `src/game/playOutcome.test.js` (test, new — proving test)

**Analog:** `src/game/playOutcome.js` (test target, lines 15–76) + idiomatic Vitest (RESEARCH §Pattern 2, FND-02).

**Verified exported functions available to assert** (from `playOutcome.js`):
- `isTurnover(result)` — line 15, returns `result?.result_type === 'TurnOver'`
- `outcomeColor(result, { favorable })` — line 71, returns `'success'` when positive yardage + favorable, else `'error'`
- `netYards`, `outcomeIcon`, `outcomeLabel`, `outcomeSummary`, `classifyOutcome`, `managedTeamHadPossession` also available

**Proving test** (RESEARCH §Pattern 2 — verified against real source):
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
> **Verified against source:** `outcomeColor({ result_type: 'Complete', result: 8 })` → `goodForOffense` true (netYards 8 > 0, not turnover), `favorable` defaults true → `'success'` ✓. `isTurnover({ result_type: 'TurnOver' })` → matches `TURNOVER_TYPE` → `true` ✓.
> The `@/game/playOutcome.js` import proves the alias resolves (FND-02). This doubles as the first Phase-2 domain test. Explicit `describe/it/expect` imports are lint-clean even with `globals: true`.

---

## Shared Patterns

### Code Style (all new/modified files)
**Source:** `.prettierrc.json` conventions (AGENTS.md) + observed in `playOutcome.js`, `main.js`, `vite.config.js`
**Apply to:** all files this phase
- No semicolons, single quotes, 2-space indent, print width 100, no trailing commas.
- ESLint/Prettier run via existing `npm run lint` / `npm run format`.

### Vuetify Registration
**Source:** `src/main.js` lines 10–17
**Apply to:** `test/setup.js` (factory form, minimal `{ components, directives }`)
```js
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
```

### Alias Reuse (FND-02, D-01)
**Source:** `vite.config.js` lines 13–17
**Apply to:** `vite.config.js` test block (shared automatically) + all `*.test.js` imports (`@/...`)
```js
resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } }
```

## No Analog Found

None. All four files have either an in-repo analog (config modifications, Vuetify registration, pure-fn test target) or a well-documented idiomatic-Vitest analog from RESEARCH.md.

## Metadata

**Analog search scope:** repo root (`vite.config.js`, `package.json`), `src/main.js`, `src/game/playOutcome.js`
**Files scanned:** 4
**Pattern extraction date:** 2026-07-13
