# Codebase Structure

**Analysis Date:** 2026-07-13

## Directory Layout

```
spf-app/
├── index.html                # Vite entry HTML, loads /src/main.js
├── vite.config.js            # Vite config, '@' → src alias, vue + vue-jsx plugins
├── package.json              # Vue 3 + Vuetify + Pinia + vue-router deps
├── .eslintrc.cjs             # ESLint (vue + prettier)
├── .prettierrc.json          # Prettier config
├── .env / .env.development / .env.production   # VITE_API_BASE_URL config
├── *.json (qb/rb/te/wr/ol/qb) # Sample player-stat fixtures (root, ad hoc)
├── public/                   # Static assets served as-is
├── docs/                     # Project docs (ui-refactor-plan.md)
├── dist/                     # Vite build output (generated)
└── src/
    ├── main.js               # App bootstrap: Pinia, router, Vuetify, theme
    ├── App.vue               # Root shell: <v-app><RouterView/>
    ├── assets/               # CSS (base/global/main) + logo.svg
    ├── router/               # vue-router route table
    ├── views/                # Route-level pages (LandingPage, GameView)
    ├── stores/               # Pinia stores (gameStore, teamStore, counter)
    ├── game/                 # Framework-agnostic domain logic
    └── components/           # Reusable Vue SFCs
        ├── PlaySelectors/    # Offense/Defense/Kickoff play selectors
        ├── players/          # Position + stat display components
        └── icons/            # SVG icon components (scaffold)
```

## Directory Purposes

**`src/views/`:**
- Purpose: Top-level, router-mounted pages
- Contains: `LandingPage.vue` (team matchup/start), `GameView.vue` (app bar + game host)
- Key files: `src/views/GameView.vue`

**`src/stores/`:**
- Purpose: Pinia state + all side effects (API calls)
- Contains: `gameStore.js`, `teamStore.js`, `counter.js` (unused scaffold)
- Key files: `src/stores/gameStore.js`, `src/stores/teamStore.js`

**`src/game/`:**
- Purpose: Pure domain logic — no Vue, no axios
- Contains: `SPFMetadata.js`, `TeamData.js`, `playOutcome.js`
- Key files: `src/game/SPFMetadata.js`

**`src/components/`:**
- Purpose: Reusable presentation components
- Contains: play-flow (`GameLayout`, `PlayLineup`, `PlayResult`, `PlayHistory`), field (`FootballField`, `SpotComponent`), player display
- Key files: `src/components/GameLayout.vue` (play-flow orchestrator)

**`src/components/PlaySelectors/`:**
- Purpose: Situation-specific play-call UIs
- Contains: `OffensePlaySelector.vue`, `DefensePlaySelector.vue`, `KickoffPlaySelector.vue`

**`src/components/players/`:**
- Purpose: Per-position and stat-cell rendering
- Contains: position SFCs (`QB`, `RB`, `WR`, `TE`, `OL`, `DL`, `LB`, `DB`, `K`, `KR`), stat cells (`SingleStat`, `RangedStat`, `TripleStat`, `NumberedStat`, `PlayerStatCard`)

## Key File Locations

**Entry Points:**
- `index.html`: HTML host, loads module
- `src/main.js`: App bootstrap + Vuetify theme

**Configuration:**
- `vite.config.js`: build + `@` alias
- `.env*`: `VITE_API_BASE_URL`
- `.eslintrc.cjs`, `.prettierrc.json`: lint/format

**Core Logic:**
- `src/stores/gameStore.js`: game flow + API
- `src/stores/teamStore.js`: roster + lineup
- `src/game/SPFMetadata.js`: domain rules

**Testing:**
- None present — no test runner, config, or `*.test.*`/`*.spec.*` files

## Naming Conventions

**Files:**
- Vue SFCs: `PascalCase.vue` (e.g., `GameLayout.vue`, `PlayResult.vue`)
- JS modules: `camelCase.js` for stores/logic (`gameStore.js`, `playOutcome.js`); `PascalCase.js` for classes (`SPFMetadata.js`, `TeamData.js`)

**Directories:**
- lowercase, plural where grouping (`stores`, `views`, `components`, `players`, `icons`)
- `PlaySelectors/` is PascalCase (inconsistent with sibling lowercase dirs)

## Where to Add New Code

**New Feature (game behavior):**
- State/API: extend `src/stores/gameStore.js` or add a new store in `src/stores/`
- Domain rules: add a pure module/class in `src/game/`

**New Page/Route:**
- View: `src/views/NewView.vue`
- Register: add route in `src/router/index.js` (use lazy `() => import(...)`)

**New Component/Module:**
- Shared UI: `src/components/` (or a topical subfolder like `PlaySelectors/`)
- Position/stat display: `src/components/players/`

**Utilities:**
- Pure helpers/domain logic: `src/game/`
- Global styles: `src/assets/*.css`

## Special Directories

**`dist/`:**
- Purpose: Vite production build output
- Generated: Yes
- Committed: Present in tree (typically gitignored — verify `.gitignore`)

**`public/`:**
- Purpose: Static files copied verbatim to build root
- Generated: No
- Committed: Yes

**Root `*.json` fixtures (`qb.json`, `rb.json`, `te.json`, `wr.json`, `ol.json`, `qb.json`):**
- Purpose: Sample player-stat data
- Generated: No
- Committed: Yes (loose at repo root — candidates for a `fixtures/` folder)

---

*Structure analysis: 2026-07-13*
