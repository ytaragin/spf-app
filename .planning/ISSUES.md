# Known Issues / Tech Debt

Documented during Phase 2 (Domain Unit Tests) per CONTEXT.md D-07. These bugs are flagged
for visibility only — they are **not fixed** and **not asserted as correct behavior** in the
test suite. Fixing them is out of scope for this milestone (see PROJECT.md: "Add tests
against current code without refactoring app source").

## 1. `InsideRun` / `InsideRight` share a duplicate `code: 'IR'`

**File:** `src/game/SPFMetadata.js`, `offensivePlays` object, approx. lines 109–124

**Current behavior:**
```js
InsideRun: {
  code: 'IR',
  description: 'Running, Inside Right [IR]',
  boxes: ['b1', 'b2', 'b3']
},
...
InsideRight: {
  code: 'IR',
  description: 'Running, Sweep Right [IR]',
  boxes: ['b1', 'b2', 'b3']
}
```

**Why it's a bug:** `InsideRun` and `InsideRight` are distinct plays but both have `code: 'IR'`.
Additionally, `InsideRight`'s description says "Sweep Right [IR]" — a mismatched bracket-code
(the description text doesn't even agree with its own `code` field). Likely a copy-paste error
when the `offensivePlays` object was authored. `InsideRight` should probably have a distinct
code such as `'SR'` (Sweep Right), matching its description.

**Not fixed in this milestone** — source refactor is out of scope per PROJECT.md constraints;
flagged here per Phase 2 CONTEXT.md D-07. `src/game/SPFMetadata.test.js` intentionally does
NOT assert on the `code` field for `InsideRun` or `InsideRight` — only `description` and
`boxes` are tested for these two plays, to avoid laundering this bug into "expected" behavior.

## 2. `getBoxLabel(box)` never matches lowercase offensive-box keys

**File:** `src/game/SPFMetadata.js`, `getBoxLabel` method (approx. lines 188–193), `labels`
object (approx. lines 89–108)

**Current behavior:**
```js
getBoxLabel(box) {
  if (Object.prototype.hasOwnProperty.call(this.metadata.labels, box)) {
    return this.metadata.labels[box]
  }
  return box
}
```
The `labels` object defines uppercase keys for offensive/special-teams boxes (`LE`, `K`, `KR`),
but the offensive box identifiers used everywhere else in the codebase are lowercase (`le`,
`k`, `kr` — see `offensiveBoxes`, `kickoffBoxes`, `kickoffReturnBoxes`). Calling
`getBoxLabel('le')` does a `hasOwnProperty` check against `'le'`, which never matches the
`'LE'` key, so the method falls through to `return box` — returning the raw, unlabeled key
(`'le'`) instead of a human-readable label (`'LE'`).

**Why it's a bug:** The `defensiveBoxes` (`box_a`..`box_o`) labels work correctly because
their keys match exactly. Only the special/offensive box labels (`LE`, `K`, `KR`) are affected
by the case mismatch, making them effectively dead/unreachable label entries under normal
lowercase box-key usage.

**Not fixed in this milestone** — source refactor is out of scope per PROJECT.md constraints;
flagged here per Phase 2 CONTEXT.md D-07. `src/game/SPFMetadata.test.js` intentionally does
NOT assert that `getBoxLabel('le')` returns `'LE'` — only working `box_*` keys are tested
against `getBoxLabel`.
