<!-- GSD:project-start source:PROJECT.md -->

## Project

**SPF App — Automated Testing**

`spf-app` is a Vue 3 single-page application that simulates a football game: users pick play types, assign lineups, and run plays against an authoritative REST backend that returns new game state. This milestone adds an **automated testing layer** (unit, component, and E2E) to a codebase that currently has zero tests, establishing repeatable quality gates for the existing app and future work.

**Core Value:** A trustworthy, fast local test suite that gives developers confidence to change the app without breaking existing gameplay — starting with the highest-value pure domain logic and extending up through stores, components, and core end-to-end flows.

### Constraints

- **Tech stack**: Vitest + `@vue/test-utils` + jsdom + `@vitest/coverage-v8` for unit/component; Playwright for E2E — because they align with the existing Vite/Vue 3 toolchain.
- **Compatibility**: Test config must reuse the existing `@` → `src` alias from `vite.config.js`; Vuetify components require a `createVuetify()` plugin instance when mounted.
- **Dependencies**: E2E against a real backend depends on backend availability and a valid `VITE_API_BASE_URL`; mocked-API mode must run with no backend.
- **Scope discipline**: Add tests against current code without refactoring app source.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- JavaScript (ES2022 / "latest" ecmaVersion) - All application logic in `src/` (`.js`, `.vue` single-file components)
- Vue SFC template syntax - UI components across `src/components/`, `src/views/`, `src/App.vue`
- CSS - Global and component styles in `src/assets/base.css`, `src/assets/global.css`, `src/assets/main.css`
- JSX - Enabled via `@vitejs/plugin-vue-jsx` (`vite.config.js`), no `.jsx` files currently detected in `src/`
- HTML - Single entry document `index.html`

## Runtime

- Node.js 20 (declared via devcontainer image `mcr.microsoft.com/devcontainers/javascript-node:20` in `.devcontainer/`)
- Browser (SPA target — client-side rendered Vue app)
- No `.nvmrc` or `engines` field in `package.json`
- npm
- Lockfile: present (`package-lock.json`, ~117 KB)

## Frameworks

- Vue `^3.3.4` - Frontend framework (Composition API, `<script setup>` style) — `src/main.js`
- Vuetify `^3.6.9` - Material Design component library, configured with `md1` blueprint and custom light/dark themes in `src/main.js`
- Pinia `^2.1.4` - State management (stores in `src/stores/`)
- Vue Router `^4.2.4` - Client-side routing with `createWebHistory` — `src/router/index.js`
- Not detected - No test runner, config, or test files present in the repository
- Vite `^4.4.6` - Build tool and dev server — `vite.config.js`
- `@vitejs/plugin-vue` `^4.2.3` - Vue SFC support
- `@vitejs/plugin-vue-jsx` `^3.0.1` - JSX support
- ESLint `^8.45.0` - Linting (`.eslintrc.cjs`) with `plugin:vue/vue3-essential`, `eslint:recommended`
- Prettier `^3.0.0` - Formatting (`.prettierrc.json`)
- `@vue/eslint-config-prettier` `^8.0.0` - ESLint/Prettier integration (skip-formatting)
- `@rushstack/eslint-patch` `^1.3.2` - Module resolution patch for ESLint config

## Key Dependencies

- `axios` `^1.4.0` - HTTP client for all backend API calls (used in `src/stores/gameStore.js`, `src/stores/teamStore.js`)
- `vue` `^3.3.4` - Core rendering framework
- `pinia` `^2.1.4` - Application state; game and team stores depend on it
- `@mdi/font` `^7.4.47` - Material Design Icons font, imported in `src/main.js` for Vuetify icon set

## Configuration

- Vite env files: `.env`, `.env.development`, `.env.production` (values not read — contain server URL config)
- Key variable: `VITE_API_BASE_URL` - Base URL for the backend game API (consumed via `import.meta.env.VITE_API_BASE_URL`)
- Built-in Vite vars used: `import.meta.env.DEV` (`src/components/GameLayout.vue`), `import.meta.env.BASE_URL` (`src/router/index.js`)
- `vite.config.js` - Vite config; registers Vue + Vue JSX plugins; defines `@` path alias → `./src`
- `index.html` - HTML entry, loads `/src/main.js` as a module

## Scripts

## Platform Requirements

- Node.js 20 + npm
- Devcontainer available (`.devcontainer/`) based on Microsoft javascript-node:20 image
- Requires a running backend server reachable at `VITE_API_BASE_URL`
- Static SPA build (`dist/`) — deployable to any static host / CDN
- Requires network access to the backend API defined by `VITE_API_BASE_URL`
- No SSR / Node server component

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Naming Patterns

- Vue components: `PascalCase.vue` — e.g. `src/components/PlayResult.vue`, `src/components/GameStatus.vue`
- Player position components: short PascalCase/uppercase names in `src/components/players/` — e.g. `QB.vue`, `RB.vue`, `WR.vue`, `DL.vue`
- Views (routed pages): `PascalCase.vue` in `src/views/` — e.g. `GameView.vue`, `LandingPage.vue`
- Plain JS modules: mixed — `camelCase.js` for logic (`playOutcome.js`, `gameStore.js`) and `PascalCase.js` for class-holding modules (`SPFMetadata.js`, `TeamData.js`)
- Grouped components use subdirectories: `src/components/PlaySelectors/`, `src/components/players/`, `src/components/icons/`
- File: `<name>Store.js` in `src/stores/` — e.g. `gameStore.js`, `teamStore.js`
- Store id (first arg to `defineStore`): lowercase — `defineStore('game', ...)`
- Composable export: `use<Name>Store` — e.g. `useGameStore`, `useTeamsStore`
- `camelCase` verbs — `fetchGame`, `setLineup`, `getPlayerFromLineup`, `updateGameStateFromPlayResult`
- Async data functions prefixed `fetch*` / `set*` / `get*` / `run*`
- Boolean-returning helpers read as predicates — `isTurnover`, `isBoxHighlighted`, `managedTeamHadPossession`
- `camelCase` — `gameState`, `playResults`, `nextPlayType`
- Server-shaped payload fields keep the API's `snake_case` (do NOT rename): `home_score`, `time_remaining`, `first_down_target`, `result_type`, `new_state`, `play_counter`
- Vuetify theme color tokens are camelCase in `src/main.js`: `offense`, `defense`, `firstDown`
- Module-level `UPPER_SNAKE_CASE` — e.g. `const TURNOVER_TYPE = 'TurnOver'` in `src/game/playOutcome.js`

## Code Style

- No semicolons (`"semi": false`)
- Single quotes (`"singleQuote": true`)
- 2-space indentation (`"tabWidth": 2`)
- Print width 100 (`"printWidth": 100`)
- No trailing commas (`"trailingComma": "none"`)
- Run: `npm run format` (`prettier --write src/`)
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

- `@` → `./src` (configured in `vite.config.js`). Components use `@/stores/gameStore`, `@/views/GameView.vue`
- Note inconsistency: some store internals use relative paths (`../game/SPFMetadata.js` in `gameStore.js`) while components use the `@` alias. Prefer `@` for new code.

## Error Handling

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

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## System Overview

```text

```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| App shell | Mounts `<v-app>` + `<RouterView>` | `src/App.vue` |
| App bootstrap | Vuetify/Pinia/router setup, theme tokens | `src/main.js` |
| Router | Route table (`/`, `/game`) | `src/router/index.js` |
| Landing view | Team matchup + "start game" entry | `src/views/LandingPage.vue` |
| Game view | App bar, error snackbar, hosts GameLayout | `src/views/GameView.vue` |
| Game layout | Orchestrates play flow: type→lineup→run→result | `src/components/GameLayout.vue` |
| Game store | Game state, play flow, API calls, hover state | `src/stores/gameStore.js` |
| Teams store | Player/team data, managed-team toggle, lineups | `src/stores/teamStore.js` |
| SPFMetadata | Static domain rules: box↔position mapping, labels | `src/game/SPFMetadata.js` |
| TeamData | Roster model: player assignment/availability | `src/game/TeamData.js` |
| playOutcome | Pure classification of play results (color/icon/label) | `src/game/playOutcome.js` |

## Pattern Overview

- Composition API throughout (`<script setup>`, `defineStore` setup-style)
- Backend-authoritative: stores POST actions and replace `gameState` from server responses
- Domain logic isolated as framework-agnostic pure classes/functions in `src/game/`
- Vuetify is the sole UI framework; theming (incl. domain color tokens) centralized in `src/main.js`

## Layers

- Purpose: Render UI, capture user intent, react to store state
- Location: `src/views/`, `src/components/`
- Contains: Vue SFCs (`.vue`) using `<script setup>` + Vuetify components
- Depends on: Pinia stores, `src/game/playOutcome.js` (for rendering helpers)
- Used by: Router / App shell
- Purpose: Single source of truth for game and team state; owns all side effects
- Location: `src/stores/`
- Contains: `gameStore` (game flow + API), `teamStore` (roster + lineup), `counter.js` (scaffold — unused)
- Depends on: axios, `src/game/` domain classes
- Used by: Views and components via `useGameStore()` / `useTeamsStore()`
- Purpose: Framework-agnostic game rules and models
- Location: `src/game/`
- Contains: `SPFMetadata` (formation/box metadata), `TeamData` (roster class), `playOutcome` (pure result classifiers)
- Depends on: nothing (no Vue, no axios)
- Used by: Stores and (for `playOutcome`) presentation components
- Purpose: HTTP communication with the backend
- Location: inline in stores via `axios` against `import.meta.env.VITE_API_BASE_URL`
- Contains: GET/POST calls to `/game/*`, `/offense/*`, `/defense/*`, `/players/*`
- Used by: Stores only

## Data Flow

### Primary Play Path

### App Load Flow

- Pinia setup stores; refs exposed and consumed via `storeToRefs()`
- `gameState` is the canonical game snapshot; always overwritten wholesale from server `new_state`
- Async UI feedback flags (`isRunningPlay`, `isSubmittingLineup`, `isSubmittingPlay`, `error`) drive loaders/snackbar

## Key Abstractions

- Purpose: Static rules mapping field "boxes" to allowed positions and labels
- Examples: `src/game/SPFMetadata.js` (`getPositionForABox`, `getBoxLabel`, `getRelatedPassDefenseBox`)
- Pattern: Instantiated once per store as a stateless helper
- Purpose: Roster model tracking available/assigned players
- Examples: `src/game/TeamData.js` (`assignPlayer`, `resetPlayer`, `getPlayersForPositions`)
- Pattern: Plain ES class stored inside a Pinia ref
- Purpose: Deterministic mapping of a play result to color/icon/label from the managed team's perspective
- Examples: `src/game/playOutcome.js` (`classifyOutcome`, `outcomeColor`, `managedTeamHadPossession`)
- Pattern: Pure, store-free; perspective passed in via `favorable` option

## Entry Points

- Location: `src/main.js` (mounted from `index.html` → `/src/main.js`)
- Triggers: Browser page load
- Responsibilities: Create app, register Pinia/router/Vuetify, define theme, mount `#app`
- Location: `src/router/index.js`
- Triggers: URL navigation
- Responsibilities: Map `/` → LandingPage, `/game` → lazy-loaded GameView

## Architectural Constraints

- **Threading:** Single-threaded browser event loop; all async is Promise-based (axios).
- **Global state:** Two Pinia singleton stores (`game`, `teams`) hold all shared mutable state. `counter.js` store is Vue scaffolding and unused.
- **Backend authority:** Client never simulates outcomes; it must round-trip to the REST API for every state change.
- **Circular imports:** None observed; domain layer has no upward dependencies.
- **Env coupling:** All API calls depend on `VITE_API_BASE_URL`; absent/wrong value silently breaks data flow (errors surface via console + snackbar).

## Anti-Patterns

### Inline transport in stores

### Placeholder/debug code left in state layer

### Duplicated per-call error handling

## Error Handling

- `err.response ? err.response.data : err.message` for message extraction
- Non-async data fetches (`fetchGame`, `fetchPlayResult`) let errors bubble to `fetchGameData`'s wrapper
- `teamStore.fetchPlayers` logs to console but does not populate `error` (inconsistent with `gameStore`)

## Cross-Cutting Concerns

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

| Skill | Description | Path |
|-------|-------------|------|
| code-review | GitHub code review operations - approve PRs, request changes, comment on code, and manage review workflows using gh CLI | `.claude/skills/code-review/SKILL.md` |
| git-github | "Git workflow and GitHub collaboration patterns including conventional commits, branch naming, PR workflow, and gh CLI usage. Use when creating commits, branches, or pull requests. TRIGGER when: git commit, branch, PR, pull request, merge, gh cli. DO NOT TRIGGER when: code implementation, testing, documentation without git operations." | `.claude/skills/git-github/SKILL.md` |
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
