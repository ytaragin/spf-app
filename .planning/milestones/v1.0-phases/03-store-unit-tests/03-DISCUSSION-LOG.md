# Phase 3: Store Unit Tests - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-16
**Phase:** 3-Store Unit Tests
**Areas discussed:** Axios mocking strategy, Error-branch coverage depth, Shared factories scope (STO-04), Randomized/no-leakage verification (Success Criteria 5), getHardCodedValue() and known scaffolding

---

## Axios Mocking Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| vi.mock('axios') module-level | Matches TESTING.md's example exactly. Simple, no extra deps. | ✓ |
| Shared mock helper module | Same approach wrapped in a helper file to reduce boilerplate. | |
| MSW (Mock Service Worker) | HTTP-layer interception; more realistic but a new dependency not mentioned in project docs. | |

**User's choice:** vi.mock('axios') module-level (Recommended)
**Notes:** Keeps setup consistent with documented pattern in TESTING.md.

---

## Error-Branch Coverage Depth

| Option | Description | Selected |
|--------|-------------|----------|
| One representative error path per action | Test one branch per action, matching Phase 2's happy-path-first precedent. | |
| Every branch, every action | Exhaustive coverage of every catch block's branches, since STO-02 calls out failure paths specifically. | ✓ |

**User's choice:** Every branch, every action
**Notes:** Deliberate departure from Phase 2's happy-path-first norm — STO-02 explicitly requires failure-path testing, and both `err.response` and network/`err.message` branches exist across most actions.

---

## Shared Factories Scope (STO-04)

| Option | Description | Selected |
|--------|-------------|----------|
| 3 factories: gameState, lineup, players | Each takes an overrides object; shapes match real backend payload fields for reuse in Phase 4/5. | ✓ |
| 4 factories: add playResult | Same 3 plus a dedicated playResult factory (nested new_state shape). | |
| Single combined factories file | All builders in one test/factories/index.js. | |

**User's choice:** 3 factories: gameState, lineup, players (Recommended)
**Notes:** None additional.

---

## Randomized/No-Leakage Verification (Success Criteria 5)

| Option | Description | Selected |
|--------|-------------|----------|
| beforeEach fresh Pinia only | Rely on Vitest's per-file isolation + setActivePinia(createPinia()) in beforeEach. | ✓ |
| Add explicit vitest sequence.shuffle config | Additionally randomize test order via config to prove no ordering dependency. | |

**User's choice:** beforeEach fresh Pinia only (Recommended)
**Notes:** None additional.

---

## getHardCodedValue() and Known Scaffolding

| Option | Description | Selected |
|--------|-------------|----------|
| Test it as-is, locks in current behavior | Asserts current 42 return value as a regression guard. | |
| Skip — don't test known stub | Avoid endorsing a documented anti-pattern/stub. | ✓ |

**User's choice:** Skip — don't test known stub
**Notes:** Flagged as anti-pattern in CONVENTIONS.md; test suite should not encode it as intentional behavior.

---

## the agent's Discretion

- Exact `describe`/`it` nesting structure within `gameStore.test.js` and `teamStore.test.js`.
- Whether the two store test files share a `beforeEach` setup helper or each defines its own.
- Precise `mockResolvedValueOnce`/`mockRejectedValueOnce` reset strategy (`vi.clearAllMocks()` placement).

## Deferred Ideas

None — discussion stayed within phase scope.
