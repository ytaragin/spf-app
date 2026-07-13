<!-- refreshed: 2026-07-13 -->
# Architecture

**Analysis Date:** 2026-07-13

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                     Vue 3 SPA (browser)                      │
├──────────────────┬──────────────────┬───────────────────────┤
│   Views/Router   │    Components    │   Vuetify UI Layer    │
│  `src/views/`    │ `src/components/`│   (theme, MDI icons)  │
│  `src/router/`   │                  │   `src/main.js`       │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Pinia Stores (app state)                    │
│   `src/stores/gameStore.js`  `src/stores/teamStore.js`       │
└────────┬──────────────────────────────────┬─────────────────┘
         │                                   │
         ▼                                   ▼
┌──────────────────────────┐   ┌─────────────────────────────┐
│  Domain Layer (pure JS)  │   │   HTTP Client (axios)       │
│  `src/game/`             │   │   → REST backend API        │
│  SPFMetadata, TeamData,  │   │   (VITE_API_BASE_URL)       │
│  playOutcome             │   │                             │
└──────────────────────────┘   └─────────────────────────────┘
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

**Overall:** Single-Page Application (SPA) with a **layered client architecture** — presentation (Vue components + Vuetify) over centralized state (Pinia) over a domain layer (plain JS classes) and a thin HTTP data layer (axios) that talks to an external REST backend. No client-side business rules for game simulation; the backend is authoritative and returns new game state.

**Key Characteristics:**
- Composition API throughout (`<script setup>`, `defineStore` setup-style)
- Backend-authoritative: stores POST actions and replace `gameState` from server responses
- Domain logic isolated as framework-agnostic pure classes/functions in `src/game/`
- Vuetify is the sole UI framework; theming (incl. domain color tokens) centralized in `src/main.js`

## Layers

**Presentation Layer:**
- Purpose: Render UI, capture user intent, react to store state
- Location: `src/views/`, `src/components/`
- Contains: Vue SFCs (`.vue`) using `<script setup>` + Vuetify components
- Depends on: Pinia stores, `src/game/playOutcome.js` (for rendering helpers)
- Used by: Router / App shell

**State Layer:**
- Purpose: Single source of truth for game and team state; owns all side effects
- Location: `src/stores/`
- Contains: `gameStore` (game flow + API), `teamStore` (roster + lineup), `counter.js` (scaffold — unused)
- Depends on: axios, `src/game/` domain classes
- Used by: Views and components via `useGameStore()` / `useTeamsStore()`

**Domain Layer:**
- Purpose: Framework-agnostic game rules and models
- Location: `src/game/`
- Contains: `SPFMetadata` (formation/box metadata), `TeamData` (roster class), `playOutcome` (pure result classifiers)
- Depends on: nothing (no Vue, no axios)
- Used by: Stores and (for `playOutcome`) presentation components

**Data/Transport Layer:**
- Purpose: HTTP communication with the backend
- Location: inline in stores via `axios` against `import.meta.env.VITE_API_BASE_URL`
- Contains: GET/POST calls to `/game/*`, `/offense/*`, `/defense/*`, `/players/*`
- Used by: Stores only

## Data Flow

### Primary Play Path

1. User picks play type → `PlayTypeSelector` → `gameStore.setPlayType()` POSTs `/game/nexttype` (`src/stores/gameStore.js:320`)
2. User assigns lineup → `teamStore.selectPlayer()` mutates `TeamData` → `gameStore.setLineup()` POSTs `/offense|defense/lineup` (`src/stores/gameStore.js:61`)
3. `gameStore.setOffensivePlay()`/`setDefensivePlay()` POSTs `/offense|defense/call` (`src/stores/gameStore.js:168`)
4. User clicks "Run Play" → `GameLayout.runPlay()` → `gameStore.runPlay()` POSTs `/game/play` (`src/stores/gameStore.js:240`)
5. `gameStore.fetchGameData()` refreshes state, play types, and latest result (`src/stores/gameStore.js:304`)
6. `updateGameStateFromPlayResult()` replaces `gameState` from `new_state` (`src/stores/gameStore.js:351`); components re-render

### App Load Flow

1. Router resolves `/` → `LandingPage` (`src/router/index.js:8`)
2. `onMounted` → `teamStore.fetchPlayers()` GETs `/players/home` + `/players/away` (`src/stores/teamStore.js:31`)
3. User "Start Game" → `router.push('/game')` → `GameView` mounts
4. `GameView.onMounted` → parallel `fetchPlayers()` + `fetchGame()` (`src/views/GameView.vue:24`)

**State Management:**
- Pinia setup stores; refs exposed and consumed via `storeToRefs()`
- `gameState` is the canonical game snapshot; always overwritten wholesale from server `new_state`
- Async UI feedback flags (`isRunningPlay`, `isSubmittingLineup`, `isSubmittingPlay`, `error`) drive loaders/snackbar

## Key Abstractions

**SPFMetadata:**
- Purpose: Static rules mapping field "boxes" to allowed positions and labels
- Examples: `src/game/SPFMetadata.js` (`getPositionForABox`, `getBoxLabel`, `getRelatedPassDefenseBox`)
- Pattern: Instantiated once per store as a stateless helper

**TeamData:**
- Purpose: Roster model tracking available/assigned players
- Examples: `src/game/TeamData.js` (`assignPlayer`, `resetPlayer`, `getPlayersForPositions`)
- Pattern: Plain ES class stored inside a Pinia ref

**playOutcome (pure functions):**
- Purpose: Deterministic mapping of a play result to color/icon/label from the managed team's perspective
- Examples: `src/game/playOutcome.js` (`classifyOutcome`, `outcomeColor`, `managedTeamHadPossession`)
- Pattern: Pure, store-free; perspective passed in via `favorable` option

## Entry Points

**App bootstrap:**
- Location: `src/main.js` (mounted from `index.html` → `/src/main.js`)
- Triggers: Browser page load
- Responsibilities: Create app, register Pinia/router/Vuetify, define theme, mount `#app`

**Router:**
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

**What happens:** axios URLs and headers are hand-built inside each store method (`src/stores/gameStore.js`, `src/stores/teamStore.js`).
**Why it's wrong:** Duplicated error handling and base-URL logic; no shared API client or interceptors.
**Do this instead:** Extract a `src/api/` client module wrapping axios with base URL + error normalization; stores call typed functions.

### Placeholder/debug code left in state layer

**What happens:** `getHardCodedValue()` returns `42` and is exported (`src/stores/gameStore.js:105`); commented-out `console.log`s remain in `TeamData`.
**Why it's wrong:** Dead surface area confuses consumers and dilutes the store API.
**Do this instead:** Remove scaffold helpers and commented debug lines.

### Duplicated per-call error handling

**What happens:** Nearly identical `try/catch` blocks repeat across `setLineup`, `setDefensivePlay`, `setOffensivePlay`, `setKickoffPlay` (`src/stores/gameStore.js`).
**Why it's wrong:** Copy-paste drift; inconsistent messages.
**Do this instead:** Centralize error extraction into a helper used by all API methods.

## Error Handling

**Strategy:** Per-call `try/catch` in stores; user-facing errors written to `gameStore.error` and rendered via the snackbar in `GameView.vue`.

**Patterns:**
- `err.response ? err.response.data : err.message` for message extraction
- Non-async data fetches (`fetchGame`, `fetchPlayResult`) let errors bubble to `fetchGameData`'s wrapper
- `teamStore.fetchPlayers` logs to console but does not populate `error` (inconsistent with `gameStore`)

## Cross-Cutting Concerns

**Logging:** `console.error`/`console.warn` throughout stores and domain classes; no logging abstraction.
**Validation:** None client-side; backend validates and returns 400 messages surfaced to the user.
**Authentication:** Not present; API calls are unauthenticated.

---

*Architecture analysis: 2026-07-13*
