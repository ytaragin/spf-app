# Phase 2: Domain Unit Tests - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-14
**Phase:** 2-Domain Unit Tests
**Areas discussed:** Existing proving test disposition, Known bugs/quirks in SPFMetadata, SPFMetadata test structure, Coverage depth & edge cases

---

## Existing Proving Test Disposition

| Option | Description | Selected |
|--------|-------------|----------|
| Expand in place | Add rest of playOutcome suite into existing file, keep 2 Phase-1 tests as-is | ✓ |
| Replace and reorganize | Delete existing tests, rewrite file from scratch | |

**User's choice:** Expand in place
**Notes:** —

---

## Known Bugs/Quirks in SPFMetadata

| Option | Description | Selected |
|--------|-------------|----------|
| Test current behavior as-is, flag as tech debt | Assert current output exactly, flag bugs in log/deferred notes | |
| Skip asserting on the buggy fields | Skip assertions for the specific duplicate-code / mismatched-label cases | ✓ |

**User's choice:** Skip asserting on the buggy fields
**Notes:** Follow-up on the InsideRun/InsideRight `code: 'IR'` duplicate specifically — user said: "Lets flag these issues ni the Issues doc and not add anything to the code about it." Confirmed: omit `code` assertions for these two plays; document both bugs in an Issues/tech-debt doc; do not fix in code.

---

## SPFMetadata Test Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Representative samples per method | One box per row-type/group, not all 15+14 boxes | ✓ |
| Exhaustive per-box coverage | Parametrize over every box | |

**User's choice:** Representative samples per method
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Full coverage of interesting logic | Both directions of getRelatedPassDefenseBox, null case, kickoff + default branches of getBoxLayoutForPlay | ✓ |
| Happy path only | One direction only, skip null case | |

**User's choice:** Full coverage of interesting logic
**Notes:** —

---

## Coverage Depth & Edge Cases

| Option | Description | Selected |
|--------|-------------|----------|
| Cover documented defensive-coding paths | Null/undefined/malformed input tests for playOutcome + TeamData | |
| Happy path only, skip defensive branches | Skip null/undefined/malformed input assertions | ✓ |

**User's choice:** Happy path only, skip defensive branches
**Notes:** Applies to both `playOutcome.js` and `TeamData.js`.

| Option | Description | Selected |
|--------|-------------|----------|
| Test both perspectives explicitly | favorable=true AND favorable=false for outcomeColor/classifyOutcome, plus possession match/mismatch | ✓ |
| Default perspective only | Only favorable=true | |

**User's choice:** Test both perspectives explicitly
**Notes:** This is the core domain behavior per the file's JSDoc — treated as a first-class test target, not symmetric/skippable.

---

## the agent's Discretion

- Exact test file naming/organization (nested `describe` grouping) within `SPFMetadata.test.js` and `TeamData.test.js`.
- Precise representative-box choices for sampling beyond the ones explicitly named in CONTEXT.md.
- Exact location/format of the Issues/tech-debt doc documenting the two SPFMetadata bugs.

## Deferred Ideas

None — discussion stayed within phase scope. The two SPFMetadata bugs (duplicate `code: 'IR'`, `getBoxLabel` case-mismatch) are tech debt to flag in an Issues doc, not deferred to a future testing phase and not fixed in this milestone.
