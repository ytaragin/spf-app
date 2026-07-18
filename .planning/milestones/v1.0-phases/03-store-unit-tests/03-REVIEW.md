---
phase: 03-store-unit-tests
reviewed: 2026-07-17T12:28:15Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/stores/gameStore.test.js
  - src/stores/teamStore.test.js
  - test/factories/factories.test.js
  - test/factories/gameState.js
  - test/factories/lineup.js
  - test/factories/players.js
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-07-17T12:28:15Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Reviewed the store unit tests (`gameStore.test.js`, `teamStore.test.js`) and the test data factories (`gameState.js`, `lineup.js`, `players.js`, and their own `factories.test.js`). All 38 tests pass against current source. No bugs, security issues, or dead-code problems in the factories themselves. The main findings are test-reliability gaps: several tests assert on values that do not actually exercise the behavior described in their own title/description, either because the store never exposes the state being claimed to be tested, or because the assertion used cannot distinguish "worked correctly" from "silently broken." These are false-confidence risks — the tests will stay green even if the underlying re-pointing/lineup-population logic regresses.

## Warnings

### WR-01: `setLineup`/`getLineup` tests can't verify "populates lineups" (store never exposes `lineups`)

**File:** `src/stores/gameStore.test.js:16-34`
**Issue:** Both tests are titled/described as verifying that `lineups` gets populated (`'sets gameMsg, populates lineups, and resets isSubmittingLineup'` and `'populates lineups for the team (no loading flag)'`), but `gameStore.js`'s public return object (lines 379-417) never exposes the internal `lineups` ref. The tests therefore only assert on `gameMsg` / `isSubmittingLineup`, which pass regardless of whether `lineups.value[func] = lineup` (gameStore.js:69) or `lineups.value[team] = response.data` (gameStore.js:124) actually executes correctly. A regression that broke lineup population (e.g. wrong key, dropped assignment) would not be caught by these tests.
**Fix:** Either expose a `getLineup`/`lineups` computed accessor from the store (e.g. `getLineup: computed(() => lineups.value)`) so the test can assert `store.getLineups.offense).toEqual(lineup)`, or reword the test descriptions to stop claiming lineup-population coverage that doesn't exist, e.g.:
```js
it('sets gameMsg and resets isSubmittingLineup', async () => { ... })
```

### WR-02: `fetchPlayers` test uses a discriminator that can't detect a re-pointing bug

**File:** `src/stores/teamStore.test.js:14-25`
**Issue:** The test asserts `store.availablePlayerIDs).toEqual(expect.arrayContaining(['QB-1', 'RB-1']))` after `fetchPlayers()`, intending to prove `team.value = teams.value[managedTeam.value]` (teamStore.js:40) executed. However, the store's default `team` ref (teamStore.js:12-18) is already seeded with `QB-1`/`RB-1`, and `buildRoster()`'s default players map (players.js:20-23) uses the exact same IDs. If the re-pointing line were removed or broken, `team.value` would still be the original default TeamData containing `QB-1`/`RB-1`, and this assertion would still pass.
**Fix:** Use distinguishable roster data to prove re-pointing actually happened, e.g.:
```js
axios.get
  .mockResolvedValueOnce({ data: buildRoster({ players: { 'WR-9': { name: 'X', id: 'WR-9', position: 'WR' } } }) })
  .mockResolvedValueOnce({ data: buildRoster({ players: { 'WR-9': { name: 'X', id: 'WR-9', position: 'WR' } } }) })
await store.fetchPlayers()
expect(store.availablePlayerIDs).toEqual(['WR-9'])
```

### WR-03: `toggleManagedTeam` test's assertions are unrelated to the "re-points the active team ref" claim in its own title

**File:** `src/stores/teamStore.test.js:84-96`
**Issue:** The test title says "flips the managed team and re-points the active team ref," but the assertions (`store.homeTeam`, `store.awayTeam`) are `computed` values (teamStore.js:109-110) that read directly from `teams.value[HOME]`/`teams.value[AWAY]` via `getTeamName`, not from `team.value`. They would return the same values whether or not `team.value = teams.value[managedTeam.value]` (teamStore.js:60) executes. No assertion in this test exercises `team.value` (e.g. via `availablePlayerIDs` or `allPlayers`) at all, so the re-pointing behavior the test claims to cover is untested.
**Fix:**
```js
it('flips the managed team and re-points the active team ref', () => {
  const store = useTeamsStore()
  store.setTeam(buildRoster({ players: { 'H-1': { name: 'H', id: 'H-1', position: 'QB' } } }), 'Home')
  store.setTeam(buildRoster({ players: { 'A-1': { name: 'A', id: 'A-1', position: 'QB' } } }), 'Away')
  store.toggleManagedTeam() // now managed = Away
  expect(store.availablePlayerIDs).toEqual(['A-1'])
})
```

## Info

### IN-01: `buildRoster`'s `availablePlayers` field is dead — never read by `TeamData`

**File:** `test/factories/players.js:19`
**Issue:** `buildRoster()` sets `availablePlayers: new Set([])` in its return shape, but `TeamData`'s constructor (`src/game/TeamData.js:2-7`) only reads `data.players` and `data.team`; it always derives its own `availablePlayers` set via `resetAllPlayers()` from `data.players`. The factory field is therefore always ignored and misleading to a reader who assumes it seeds initial availability.
**Fix:** Remove the field from the factory (or add a comment noting it's currently unused/ignored by `TeamData` and kept only for documentation of the wrapper shape):
```js
export function buildRoster(overrides = {}) {
  return {
    team: { name: 'Testers' },
    // NOTE: availablePlayers is not read by TeamData — availability is always
    // derived from `players` via resetAllPlayers(). Field omitted intentionally.
    players: {
      'QB-1': { name: 'Joe', id: 'QB-1', position: 'QB' },
      'RB-1': { name: 'John', id: 'RB-1', position: 'RB' }
    },
    ...overrides
  }
}
```

### IN-02: `buildLineup`'s array-valued `WR` field is never exercised by `factories.test.js`

**File:** `test/factories/factories.test.js:30-39`
**Issue:** `buildLineup()` defaults `WR` to an array (`['WR-1', 'WR-2']`), mirroring the array-handling branch in `gameStore.js`'s `getPlayerFromLineup` (`if (Array.isArray(p)) { p = p[0] }`). `factories.test.js` only asserts on `buildLineup().QB`, so the array shape of the default fixture is untested by the factory's own test suite (though it is implicitly covered by any consumer test that reads `WR`).
**Fix:** Add a small assertion for completeness:
```js
it('returns a lineup object', () => {
  expect(typeof buildLineup()).toBe('object')
  expect(buildLineup().QB).toBe('QB-1')
  expect(buildLineup().WR).toEqual(['WR-1', 'WR-2'])
})
```

---

_Reviewed: 2026-07-17T12:28:15Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
