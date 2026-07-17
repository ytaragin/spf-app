/* eslint-env node */
import { defineConfig } from '@playwright/test'

// https://playwright.dev/docs/test-configuration
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30000
  },
  // The app itself always runs on the local Vite dev server, so both projects
  // share the same baseURL. What distinguishes them is the *backend* they
  // talk to: the `mocked` project installs page.route() handlers (see
  // e2e/play-flow.spec.js) so no request ever reaches a real server, while
  // the `live` project installs no mocks and lets the dev server's existing
  // VITE_API_BASE_URL (read from .env/.env.development) resolve requests
  // against a real backend. Project selection (`--project=live`) is the
  // env-driven switch - no separate Playwright-level env override is needed.
  projects: [
    { name: 'mocked', use: { baseURL: 'http://localhost:5173' } },
    { name: 'live', use: { baseURL: 'http://localhost:5173' } }
  ]
})
