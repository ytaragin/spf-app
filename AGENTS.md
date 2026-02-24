# AGENTS.md — Strat-Pro Football (SPF) App

## Project Overview

Vue 3 SPA (JavaScript, no TypeScript) for a Strat-Pro Football simulation game.
Communicates with a REST API backend at `http://127.0.0.1:8080` (not part of this repo).
Built with Vite, uses Pinia for state management, Vue Router, and Vuetify 3 (MD1 blueprint).

## Tech Stack

- **Framework:** Vue 3.3 (mixed Options API + `<script setup>`)
- **Build:** Vite 4
- **State:** Pinia 2 (Composition API style stores)
- **UI:** Vuetify 3 (full component registration, MD1 blueprint)
- **HTTP:** Axios
- **Router:** Vue Router 4
- **Language:** JavaScript (ES latest) — no TypeScript
- **Package manager:** npm

## Build / Lint / Test Commands

```bash
# Development server (port 5173)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint (ESLint, auto-fix enabled)
npm run lint

# Format (Prettier on src/)
npm run format
```

**No testing framework is configured.** There are no test scripts, no test config
files, and no test files in the codebase. If adding tests, Vitest is the
recommended choice for a Vite-based project.

## Project Structure

```
src/
├── App.vue                  # Root component (renders GameLayout directly)
├── main.js                  # Entry point: Vue + Pinia + Router + Vuetify
├── assets/                  # CSS files (base.css, main.css, global.css)
├── components/              # All Vue components
│   ├── *.vue                # Top-level game UI components
│   ├── players/             # Position-specific stat card components (QB.vue, RB.vue, etc.)
│   └── PlaySelectors/       # Play calling components (Offense, Defense, Kickoff)
├── game/                    # Pure JS domain classes (no Vue dependency)
│   ├── SPFMetadata.js       # Game metadata: positions, plays, field layout
│   └── TeamData.js          # Team data model
├── router/                  # Vue Router config (index.js)
├── stores/                  # Pinia stores
│   ├── gameStore.js         # Game state, API calls, play management
│   └── teamStore.js         # Team/player data, lineup management
└── views/                   # Route-level page components (mostly unused)
```

- `components/` is mostly flat; sub-directories group related components only.
- `game/` holds pure JS domain logic with no Vue imports.
- `stores/` has one file per Pinia store.
- `public/` has static assets (field images, ball images, favicon).
- Top-level JSON files (qb.json, rb.json, etc.) are sample player data.

## Code Style and Formatting

### Prettier (enforced via `npm run format`)

- **No semicolons** (`semi: false`)
- **Single quotes** (`singleQuote: true`)
- **2-space indentation** (`tabWidth: 2`)
- **100-char print width** (`printWidth: 100`)
- **No trailing commas** (`trailingComma: "none"`)

### ESLint (enforced via `npm run lint`)

- Extends: `plugin:vue/vue3-essential`, `eslint:recommended`
- Prettier conflict rules are disabled via `@vue/eslint-config-prettier/skip-formatting`
- No custom rules defined
- Targets ECMAScript latest

### Import Conventions

- The `@` alias maps to `./src` (configured in vite.config.js).
- **Prefer `@/` alias** for imports from `src/` (e.g., `import { useGameStore } from '@/stores/gameStore'`).
  The codebase currently mixes `@/` and relative paths — prefer `@/` for consistency going forward.
- `.js` extensions are sometimes included on local imports — match the existing pattern in the file you are editing.
- **Import order** (informal, not enforced):
  1. Vue/framework imports (`vue`, `vue-router`)
  2. Third-party libraries (`pinia`, `axios`, `vuetify`)
  3. Local stores and game modules
  4. Component imports

### Vue Component Conventions

- **Two API styles coexist:**
  - Most components use **Options API** with `defineComponent()` + `setup()` function.
  - Simpler/newer components use **`<script setup>`** (Composition API sugar).
  - When editing, match the style already used in the file.
  - For new components, prefer `<script setup>` unless the component needs Options API features.
- Pinia stores use Composition API style: `defineStore('name', () => { ... })`.
- Use `storeToRefs()` for reactive destructuring of store state.

### Naming Conventions

| Element             | Convention     
| ------------------- | -------------- 
| Vue components      | PascalCase    
| Position components | Uppercase abbr 
| JS modules          | camelCase      
| Game classes        | PascalCase     
| CSS files           | kebab-case     
| Functions/variables | camelCase      
| String constants    | UPPER_CASE     
| Store composables   | `useXxxStore`  
| CSS classes         | kebab-case     
| API/backend fields  | snake_case     

### Styling
- Use plain kebab-case class names.
- Global styles live in `src/assets/` 

## Error Handling

- Communicate errors to the UI via the `gameMsg` ref in gameStore.
- Always handle axios errors — never leave async API calls without try/catch.

### Logging

Use the correct console severity level for the situation:

| Situation                                  | Use                            |
| ------------------------------------------ | ------------------------------ |
| Caught errors, failed API calls            | `console.error(...)`           |
| Unexpected but recoverable conditions      | `console.warn(...)`            |
| Temporary debugging (remove before commit) | `console.log(...)`             |
| User-facing error/status messages          | Set `gameMsg` ref in gameStore |


## Key Architectural Notes

- The app bypasses Vue Router — `App.vue` renders `<GameLayout />` directly
  (not `<RouterView />`). Routes to Home/About exist but are unused.
- Both stores hardcode `baseUrl = "http://127.0.0.1:8080"` — no env variable usage.
- Vuetify is registered globally with all components/directives (no tree-shaking).
- The app manages two football teams (Home/Away); one is the "managed team" controlled by the user.
