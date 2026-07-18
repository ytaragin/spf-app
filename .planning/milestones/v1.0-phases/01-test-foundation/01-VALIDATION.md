---
phase: 1
slug: test-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-13
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.2.x (installed by this phase — Wave 0) |
| **Config file** | `vite.config.js` (merged `test` block via `/// <reference types="vitest/config" />`) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test && npm run test:coverage` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test && npm run test:coverage`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | FND-01 | — | N/A | build | `npm run build && npm run dev -- --host --port 0` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | FND-02 | — | N/A | unit | `npm test` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | FND-03 | — | N/A | unit | `npm test` | ❌ W0 | ⬜ pending |
| 1-01-04 | 01 | 1 | FND-04 | — | N/A | unit | `npm run test:coverage` | ❌ W0 | ⬜ pending |
| 1-01-05 | 01 | 1 | FND-05 | — | N/A | cli | `npm run` (script presence) | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vite`/`vitest`/`jsdom`/`@vitest/coverage-v8` install — no test framework currently exists
- [ ] `test/setup.js` — shared Vuetify + jsdom shims registered via `setupFiles`
- [ ] `src/game/playOutcome.test.js` — the single proving test (real pure function, proves `@` alias + jsdom + globals)

*This phase IS the Wave 0 that installs the framework for all downstream phases (2–5).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `npm run dev` serves the upgraded Vite 6 app in a browser | FND-01 | Dev-server smoke needs a live browser session | Run `npm run dev`, open the printed URL, confirm the app renders without console errors |

*Automated `npm run build` covers the build half of FND-01; dev-serve is the manual half.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
