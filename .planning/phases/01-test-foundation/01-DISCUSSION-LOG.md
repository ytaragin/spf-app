# Phase 1: Test Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-13
**Phase:** 1-Test Foundation
**Areas discussed:** Vitest config location, DOM environment choice, Test file location convention, Vue plugin versions for Vite 6

---

## Gray Area Selection

Presented 5 candidate gray areas; user selected 4 to discuss. Not selected: "The trivial proving test" (left to the agent's discretion).

---

## Vitest Config Location

| Option | Description | Selected |
|--------|-------------|----------|
| Merge into vite.config.js | Add `test` block to existing vite.config.js via `/// <reference types="vitest/config" />`. Single source, alias shared. | ✓ |
| Separate vitest.config.js + mergeConfig | Isolated config importing vite config via mergeConfig. | |
| Standalone vitest.config.js | Fully decoupled, re-declares `@` alias (risks drift). | |

**User's choice:** Merge into vite.config.js (Recommended)
**Notes:** Keeps a single source of truth for the `@`→`src` alias, satisfying FND-02's reuse constraint without duplication.

---

## DOM Environment Choice

| Option | Description | Selected |
|--------|-------------|----------|
| jsdom | Broadest fidelity, battle-tested with Vuetify + @vue/test-utils. Slower. | ✓ |
| happy-dom | ~2-3x faster startup, thinner API — higher Vuetify-compat risk. | |

**User's choice:** jsdom (Recommended)
**Notes:** Env is inherited by Phase 4 component tests where Vuetify mounts; fidelity prioritized over speed.

---

## Test File Location Convention

| Option | Description | Selected |
|--------|-------------|----------|
| Co-located tests + test/ for shared infra | Tests next to source; setup.js/factories in top-level test/. | ✓ |
| All tests in top-level test/ mirror | Mirror src under test/; breaks locality, diverges from norms. | |
| src/__tests__/ folders | Grouped per-directory; extra nesting, less common in Vue SFC projects. | |

**User's choice:** Co-located tests + test/ for shared infra (Recommended)
**Notes:** Matches Vitest defaults and TESTING.md; roadmap already places setup.js at test/setup.js and factories at test/factories/.

---

## Vue Plugin Versions for Vite 6

| Option | Description | Selected |
|--------|-------------|----------|
| Lock plugin-vue ^5 + plugin-vue-jsx ^4 | Concrete current majors compatible with Vite 6 + Vue 3.3+. | ✓ |
| Defer exact versions to research | Require "latest compatible majors", decide later. | |

**User's choice:** Lock plugin-vue ^5 + plugin-vue-jsx ^4 (Recommended)
**Notes:** Bumps from current ^4.2.3 / ^3.0.1. Exact Vite 6 minor left to research.

---

## the agent's Discretion

- The single Phase-1 proving test's exact assertion (recommended: a real `playOutcome.js` function over a `1+1` smoke test).
- Coverage reporter format (text/html/json).
- Exact Vite 6 minor/patch version.

## Deferred Ideas

- CI integration (CI-01/02/03) — v2.
- Coverage threshold enforcement (COV-01) — v2.
- happy-dom migration — revisit post-maturity if speed matters.
