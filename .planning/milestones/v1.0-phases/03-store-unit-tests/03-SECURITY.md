---
phase: 03
slug: store-unit-tests
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-07-17
---

# Phase 03 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
>
> **Register origin:** retroactive-STRIDE (no `<threat_model>` block existed in any PLAN.md — this phase was authored before formal threat modelling was standard practice for the project).

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Test process ↔ mocked axios | `vi.mock('axios')` intercepts all HTTP calls in gameStore/teamStore specs | Synthetic fixture payloads only — no real network I/O |
| Vitest config ↔ file discovery | `test.include` glob in `vite.config.js` determines which files execute as specs | File paths only; no runtime data |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-03-01 | Spoofing / Tampering / Repudiation | gameStore.test.js, teamStore.test.js | n/a | accept (scope N/A) | No production/runtime code, auth, or session logic touched; all HTTP calls mocked via `vi.mock('axios')` | closed |
| T-03-02 | Information Disclosure | test/factories/*.js, *.test.js | low | mitigate (verified) | All fixture data confirmed synthetic/placeholder (`QB-1`, `RB-1`, `Joe`, `John`, `Testers`, generic error strings) — no real credentials, tokens, or PII found on full-file inspection | closed |
| T-03-03 | Denial of Service | vite.config.js (test.include glob) | low | mitigate (verified) | New `test/**/*.{test,spec}.{js,jsx}` clause reuses the same extension filter as `src/**`, does not broaden to `test/**/*` or `**/*`; coverage `exclude` still excludes `test/**` | closed |
| T-03-04 | Elevation of Privilege | N/A | n/a | accept (scope N/A) | No production code modified (`src/stores/gameStore.js`, `src/stores/teamStore.js`, `src/game/TeamData.js` untouched); no auth/role logic introduced | closed |

*Status: open · closed · open — below {block_on} threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

No accepted risks.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-07-17 | 4 | 4 | 0 | gsd-security-auditor (retroactive-STRIDE mode) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-17
