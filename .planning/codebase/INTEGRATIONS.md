# External Integrations

**Analysis Date:** 2026-07-13

## APIs & External Services

**Backend Game API (SPF game server):**
- Purpose: Provides game state, team/player data, lineup submission, play calling, and play results
- SDK/Client: `axios` `^1.4.0`
- Base URL: `import.meta.env.VITE_API_BASE_URL` (configured per environment via `.env*` files)
- Consumers: `src/stores/gameStore.js`, `src/stores/teamStore.js`
- Auth: None detected — no auth headers, tokens, or credentials attached to requests

### Endpoints Consumed

Defined in `src/stores/gameStore.js` and `src/stores/teamStore.js`, all relative to `VITE_API_BASE_URL`:

| Method | Endpoint | Purpose | File |
|--------|----------|---------|------|
| GET | `/game/state` | Fetch current game state | `src/stores/gameStore.js` (`fetchGame`) |
| GET | `/game/nexttype` | Fetch allowed/next play types | `src/stores/gameStore.js` (`fetchPlayTypes`) |
| POST | `/game/nexttype` | Set next play type (`text/plain` body) | `src/stores/gameStore.js` (`setPlayType`) |
| POST | `/game/play` | Run the current play | `src/stores/gameStore.js` (`runPlay`) |
| GET | `/game/plays?result=true&count=1` | Fetch latest play result | `src/stores/gameStore.js` (`fetchPlayResult`) |
| GET | `/game/plays?result=true` | Fetch all play results | `src/stores/gameStore.js` (`fetchAllPlayResults`) |
| GET/POST | `/offense/lineup` | Get / submit offensive lineup | `src/stores/gameStore.js` (`getLineup`, `setLineup`) |
| GET/POST | `/defense/lineup` | Get / submit defensive lineup | `src/stores/gameStore.js` (`getLineup`, `setLineup`) |
| POST | `/offense/call` | Submit offensive / kickoff play (`application/json`) | `src/stores/gameStore.js` (`setOffensivePlay`, `setKickoffPlay`) |
| POST | `/defense/call` | Submit defensive play (`application/json`) | `src/stores/gameStore.js` (`setDefensivePlay`) |
| GET | `/players/away` | Fetch away team roster | `src/stores/teamStore.js` (`fetchPlayers`) |
| GET | `/players/home` | Fetch home team roster | `src/stores/teamStore.js` (`fetchPlayers`) |

## Data Storage

**Databases:**
- None client-side. All persistent state lives on the backend game server accessed via the API above.

**File Storage:**
- Local static assets only (`src/assets/`, `public/`)
- Static JSON reference/data files at repo root: `ol.json`, `qb.json`, `rb.json`, `te.json`, `wr.json` (game/position data, bundled — not a runtime external service)

**Caching:**
- None. Client state held in-memory via Pinia stores (`src/stores/gameStore.js`, `src/stores/teamStore.js`, `src/stores/counter.js`)

## Authentication & Identity

**Auth Provider:**
- None detected. No login flow, tokens, session management, or auth headers on API requests.

## Monitoring & Observability

**Error Tracking:**
- None. Errors are surfaced to the UI via store `error`/`gameMsg` state and logged with `console.error` (see catch blocks in `src/stores/gameStore.js`, `src/stores/teamStore.js`).

**Logs:**
- Browser `console` only

## CI/CD & Deployment

**Hosting:**
- Not configured in repo. Produces a static SPA build in `dist/` deployable to any static host.

**CI Pipeline:**
- None detected (no `.github/workflows/`, CI config files, or pipeline definitions)

## Environment Configuration

**Required env vars:**
- `VITE_API_BASE_URL` - Backend API base URL (required for all data operations)

**Env files present (values not inspected):**
- `.env`, `.env.development`, `.env.production`

**Secrets location:**
- No secrets detected. `VITE_API_BASE_URL` is a public build-time value (Vite inlines `VITE_*` vars into the client bundle — do not store secrets here).

## Webhooks & Callbacks

**Incoming:**
- None (client-side SPA, no server endpoints)

**Outgoing:**
- None beyond the polled/request-response REST calls to the game API. No WebSocket, SSE, or push integration detected — play results are retrieved by explicit GET requests (`fetchPlayResult` / `fetchGameData`).

---

*Integration audit: 2026-07-13*
