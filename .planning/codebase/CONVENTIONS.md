# Coding Conventions

**Analysis Date:** 2026-07-13

This is a **Vue 3 + Vite + Vuetify 3 + Pinia** single-page application (a Star Pro Football game UI). All source lives under `src/`. Code is authored as ES modules with **no TypeScript** — plain JavaScript (`.js`) and Vue SFCs (`.vue`).

## Naming Patterns

**Files:**
- Vue components: `PascalCase.vue` — e.g. `src/components/PlayResult.vue`, `src/components/GameStatus.vue`
- Player position components: short PascalCase/uppercase names in `src/components/players/` — e.g. `QB.vue`, `RB.vue`, `WR.vue`, `DL.vue`
- Views (routed pages): `PascalCase.vue` in `src/views/` — e.g. `GameView.vue`, `LandingPage.vue`
- Plain JS modules: mixed — `camelCase.js` for logic (`playOutcome.js`, `gameStore.js`) and `PascalCase.js` for class-holding modules (`SPFMetadata.js`, `TeamData.js`)
- Grouped components use subdirectories: `src/components/PlaySelectors/`, `src/components/players/`, `src/components/icons/`

**Pinia stores:**
- File: `<name>Store.js` in `src/stores/` — e.g. `gameStore.js`, `teamStore.js`
- Store id (first arg to `defineStore`): lowercase — `defineStore('game', ...)`
- Composable export: `use<Name>Store` — e.g. `useGameStore`, `useTeamsStore`

**Functions:**
- `camelCase` verbs — `fetchGame`, `setLineup`, `getPlayerFromLineup`, `updateGameStateFromPlayResult`
- Async data functions prefixed `fetch*` / `set*` / `get*` / `run*`
- Boolean-returning helpers read as predicates — `isTurnover`, `isBoxHighlighted`, `managedTeamHadPossession`

**Variables:**
- `camelCase` — `gameState`, `playResults`, `nextPlayType`
- Server-shaped payload fields keep the API's `snake_case` (do NOT rename): `home_score`, `time_remaining`, `first_down_target`, `result_type`, `new_state`, `play_counter`
- Vuetify theme color tokens are camelCase in `src/main.js`: `offense`, `defense`, `firstDown`

**Constants:**
- Module-level `UPPER_SNAKE_CASE` — e.g. `const TURNOVER_TYPE = 'TurnOver'` in `src/game/playOutcome.js`

## Code Style

**Formatting (Prettier — `.prettierrc.json`):**
- No semicolons (`"semi": false`)
- Single quotes (`"singleQuote": true`)
- 2-space indentation (`"tabWidth": 2`)
- Print width 100 (`"printWidth": 100`)
- No trailing commas (`"trailingComma": "none"`)
- Run: `npm run format` (`prettier --write src/`)

**Linting (ESLint — `.eslintrc.cjs`):**
- Extends `plugin:vue/vue3-essential`, `eslint:recommended`, and `@vue/eslint-config-prettier/skip-formatting` (Prettier owns formatting; ESLint does not fight it)
- `ecmaVersion: 'latest'`, `root: true`
- Run: `npm run lint` (`eslint . --ext .vue,.js,.jsx,.cjs,.mjs --fix --ignore-path .gitignore`) — note `--fix` is on by default

## Vue Component Conventions

- **Composition API with `<script setup>`** universally — every SFC uses `<script setup>` (see `src/components/PlayResult.vue`)
- SFC section order: `<template>` → `<script setup>` → `<style scoped>`
- `defineOptions({ name: '<ComponentName>' })` used to set an explicit component name (e.g. `PlayResult.vue` line 110)
- Styles are `scoped`; component-local classes are kebab-case (`.play-details`, `.state-grid`)
- Reactivity: `ref` for local state, `computed` for derived values
- Store access: call `useXStore()`, then destructure reactive fields with `storeToRefs(store)` (never plain-destructure reactive state); call actions directly on the store object (`gameStore.fetchPlayResult()`)
- Vuetify components (`v-card`, `v-btn`, `v-alert`, ...) and utility classes (`d-flex`, `text-h6`, `mb-3`) are used directly in templates
- Theme colors referenced by semantic name (`success`, `error`) rather than hex; domain tokens (`offense`, `defense`, `home`, `away`, `firstDown`) defined once in `src/main.js`

## Import Organization

Observed order (see `src/main.js`, `src/stores/gameStore.js`):
1. CSS/asset side-effect imports (`import './assets/main.css'`)
2. Framework packages (`vue`, `pinia`, `vue-router`, `axios`)
3. Vuetify + plugin imports
4. Local modules — stores, game logic, components

**Path Aliases:**
- `@` → `./src` (configured in `vite.config.js`). Components use `@/stores/gameStore`, `@/views/GameView.vue`
- Note inconsistency: some store internals use relative paths (`../game/SPFMetadata.js` in `gameStore.js`) while components use the `@` alias. Prefer `@` for new code.

## Error Handling

Dominant pattern (see `src/stores/gameStore.js`), consistent across store actions:

```js
async function setLineup(lineup, isDefense) {
  let func = isDefense ? 'defense' : 'offense'
  let url = `${baseUrl}/${func}/lineup`
  isSubmittingLineup.value = true
  try {
    const response = await axios.post(url, lineup)
    gameMsg.value = response.data
    lineups.value[func] = lineup
  } catch (err) {
    if (err.response) {
      let msg = err.response.data
      console.error(`Error setting lineup: ${msg}`)
      gameMsg.value = msg
      error.value = `Failed to set ${func} lineup: ${msg}`
    } else {
      error.value = `Failed to set ${func} lineup`
    }
  } finally {
    isSubmittingLineup.value = false
  }
}
```

Conventions:
- `try/catch/finally` around every `axios` call in store actions
- `finally` resets the matching `is*ing` loading flag (`isSubmittingLineup`, `isRunningPlay`, `isSubmittingPlay`)
- Distinguish `err.response` (HTTP error with server body) from network/other errors
- User-facing message written to `error.value` (surfaced via snackbar); raw server text written to `gameMsg.value`
- Always `console.error(...)` with an interpolated context string
- Errors are generally swallowed (not re-thrown) so the UI stays responsive — `runPlay()` is the one exception that re-throws on network failure
- Pure logic modules (`playOutcome.js`) do NOT throw; they defensive-code with optional chaining and defaults (`result?.result_type`, `Number.isFinite(n) ? n : 0`)

## Logging

- **`console.error` / `console.log` only** — no logging library
- Error logs use interpolated template strings with a leading context phrase: `` console.error(`Error fetching ${team} lineup: ${msg}`) ``

## Comments

- **JSDoc block comments on exported pure functions** — extensively in `src/game/playOutcome.js` (every export documented with `@param`/description). This is the gold-standard reference for utility documentation in the repo.
- Inline `//` comments explain *why* / domain intent (play-flow state, perspective inversion), not *what*
- Module-level header comment describing purpose and constraints (see top of `playOutcome.js`: "Pure functions only — no store access")
- No TSDoc (no TypeScript)

## Function & Module Design

- **Pure logic extracted from components** into `src/game/*` modules (single source of truth) — e.g. `classifyOutcome`/`outcomeColor` live in `playOutcome.js`, not in `PlayResult.vue`. Components import and wrap them in `computed`.
- Options objects with destructured defaults for optional params: `outcomeColor(result, { favorable = true } = {})`
- Pinia stores use the **setup-store (function) form**: define `ref`/`computed`/functions, then `return { ... }` an explicit public surface at the bottom (`gameStore.js` lines 379–417)
- `computed` getters exposed from stores use a `get*` naming prefix (`getPlayTypes`, `getPlayResult`)

## Anti-Patterns To Avoid (observed in current code)

- `getHardCodedValue()` returning `42` in `gameStore.js` — a stub/placeholder; do not imitate
- Empty `// handle success here` / `// handle error here` comment stubs left in `catch` blocks
- Mixing `@` alias and relative imports within the same layer — standardize on `@`
- Loose equality (`==`, `!=`) appears in store helpers (`id == null || id == ''`) — prefer `===`/`!==` for new code

---

*Convention analysis: 2026-07-13*
