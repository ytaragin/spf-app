# spf-app

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## Testing

Unit and component tests use [Vitest](https://vitest.dev/) + [`@vue/test-utils`](https://test-utils.vuejs.org/). End-to-end tests use [Playwright](https://playwright.dev/).

### Run all tests once

```sh
npm test
```

### Run tests in watch mode

```sh
npm run test:watch
```

### Run tests with coverage

```sh
npm run test:coverage
```

### Run a single test file

```sh
npx vitest run src/game/playOutcome.test.js
```

### Filter tests by name

```sh
npx vitest run -t "outcomeColor"
```

## End-to-End Tests

E2E tests use [Playwright](https://playwright.dev/) and live in `e2e/`. The Vite dev server is started automatically (via Playwright's `webServer` config), so you don't need to run `npm run dev` yourself first.

### One-time setup

Install the Playwright browser binaries (only needed once, or after upgrading `@playwright/test`):

```sh
npx playwright install chromium
```

### Run the hermetic (mocked) suite — default, no backend required

All network calls are intercepted with `page.route()` mocks, so this runs with zero real backend dependency:

```sh
npm run test:e2e
```

This is equivalent to:

```sh
npx playwright test --project=mocked
```

### Run against a real backend

Requires a running backend reachable at `VITE_API_BASE_URL` (see `.env` / `.env.development`). This runs the same spec with no mocks installed:

```sh
npx playwright test --project=live
```

### List tests without running them

```sh
npx playwright test --list
```

### Run E2E tests in UI mode (interactive debugging)

```sh
npx playwright test --ui
```
