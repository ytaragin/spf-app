# Technology Stack

**Analysis Date:** 2026-07-13

## Languages

**Primary:**
- JavaScript (ES2022 / "latest" ecmaVersion) - All application logic in `src/` (`.js`, `.vue` single-file components)
- Vue SFC template syntax - UI components across `src/components/`, `src/views/`, `src/App.vue`

**Secondary:**
- CSS - Global and component styles in `src/assets/base.css`, `src/assets/global.css`, `src/assets/main.css`
- JSX - Enabled via `@vitejs/plugin-vue-jsx` (`vite.config.js`), no `.jsx` files currently detected in `src/`
- HTML - Single entry document `index.html`

**Note:** No TypeScript. This is a plain JavaScript Vue 3 project (README references Volar/TS tooling but no `tsconfig.json` exists).

## Runtime

**Environment:**
- Node.js 20 (declared via devcontainer image `mcr.microsoft.com/devcontainers/javascript-node:20` in `.devcontainer/`)
- Browser (SPA target — client-side rendered Vue app)
- No `.nvmrc` or `engines` field in `package.json`

**Package Manager:**
- npm
- Lockfile: present (`package-lock.json`, ~117 KB)

## Frameworks

**Core:**
- Vue `^3.3.4` - Frontend framework (Composition API, `<script setup>` style) — `src/main.js`
- Vuetify `^3.6.9` - Material Design component library, configured with `md1` blueprint and custom light/dark themes in `src/main.js`
- Pinia `^2.1.4` - State management (stores in `src/stores/`)
- Vue Router `^4.2.4` - Client-side routing with `createWebHistory` — `src/router/index.js`

**Testing:**
- Not detected - No test runner, config, or test files present in the repository

**Build/Dev:**
- Vite `^4.4.6` - Build tool and dev server — `vite.config.js`
- `@vitejs/plugin-vue` `^4.2.3` - Vue SFC support
- `@vitejs/plugin-vue-jsx` `^3.0.1` - JSX support
- ESLint `^8.45.0` - Linting (`.eslintrc.cjs`) with `plugin:vue/vue3-essential`, `eslint:recommended`
- Prettier `^3.0.0` - Formatting (`.prettierrc.json`)
- `@vue/eslint-config-prettier` `^8.0.0` - ESLint/Prettier integration (skip-formatting)
- `@rushstack/eslint-patch` `^1.3.2` - Module resolution patch for ESLint config

## Key Dependencies

**Critical:**
- `axios` `^1.4.0` - HTTP client for all backend API calls (used in `src/stores/gameStore.js`, `src/stores/teamStore.js`)
- `vue` `^3.3.4` - Core rendering framework
- `pinia` `^2.1.4` - Application state; game and team stores depend on it

**Infrastructure:**
- `@mdi/font` `^7.4.47` - Material Design Icons font, imported in `src/main.js` for Vuetify icon set

## Configuration

**Environment:**
- Vite env files: `.env`, `.env.development`, `.env.production` (values not read — contain server URL config)
- Key variable: `VITE_API_BASE_URL` - Base URL for the backend game API (consumed via `import.meta.env.VITE_API_BASE_URL`)
- Built-in Vite vars used: `import.meta.env.DEV` (`src/components/GameLayout.vue`), `import.meta.env.BASE_URL` (`src/router/index.js`)

**Build:**
- `vite.config.js` - Vite config; registers Vue + Vue JSX plugins; defines `@` path alias → `./src`
- `index.html` - HTML entry, loads `/src/main.js` as a module

## Scripts

```bash
npm run dev       # vite — start dev server
npm run build     # vite build — production build (outputs to dist/)
npm run preview   # vite preview — preview production build
npm run lint      # eslint . --ext .vue,.js,.jsx,.cjs,.mjs --fix
npm run format    # prettier --write src/
```

## Platform Requirements

**Development:**
- Node.js 20 + npm
- Devcontainer available (`.devcontainer/`) based on Microsoft javascript-node:20 image
- Requires a running backend server reachable at `VITE_API_BASE_URL`

**Production:**
- Static SPA build (`dist/`) — deployable to any static host / CDN
- Requires network access to the backend API defined by `VITE_API_BASE_URL`
- No SSR / Node server component

---

*Stack analysis: 2026-07-13*
