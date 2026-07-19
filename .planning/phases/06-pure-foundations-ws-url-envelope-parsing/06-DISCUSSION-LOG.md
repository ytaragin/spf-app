# Phase 6: Pure Foundations — WS URL + Envelope Parsing - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-19
**Phase:** 6-Pure Foundations — WS URL + Envelope Parsing
**Areas discussed:** parseEvent return contract, Input type (string vs object), toWebSocketUrl edge cases, Rejection logging

---

## parseEvent return contract

| Option | Description | Selected |
|--------|-------------|----------|
| Success: {event,data}; reject: null | Valid → pass-through {event,data}; invalid/unknown → null; defensive-null caller pattern | ✓ |
| Result object {ok, ...} | Always return {ok:true, event, data} or {ok:false, reason} | |
| Normalized {type, payload}; reject null | Rename fields to decouple from wire naming; reject → null | |

**User's choice:** Success: {event,data}; reject: null
**Notes:** Matches `playOutcome.js` defensive-null style; keeps wire naming.

---

## Input type: string vs object

| Option | Description | Selected |
|--------|-------------|----------|
| Accept string; JSON.parse inside | parseEvent parses raw JSON string in try/catch, null on syntax error | |
| Accept pre-parsed object only | Caller (composable) owns JSON.parse; parseEvent only validates shape | ✓ |
| Accept both string and object | Tolerant: parse if string, use as-is if object | |

**User's choice:** Accept pre-parsed object only
**Notes:** `useGameSocket` (Phase 9) owns `JSON.parse` of `event.data` + syntax-error handling. parseEvent stays purely envelope-shape validation.

---

## toWebSocketUrl edge cases

| Option | Description | Selected |
|--------|-------------|----------|
| URL ctor, path=/game/ws, throw on invalid | Swap protocol, preserve host+port, set pathname; throw on invalid/empty | ✓ |
| Return null on invalid input | Same derivation but null on invalid, composable skips connecting | |
| String-based derivation | Regex protocol replace + manual path append | |

**User's choice:** URL ctor, path=/game/ws, throw on invalid
**Notes:** Fail loud at startup — a broken base URL means the whole app is non-functional.

---

## Rejection logging detail

| Option | Description | Selected |
|--------|-------------|----------|
| console.warn + context + event tag | warn because ignoring is expected/recoverable | |
| console.error (matches repo convention) | All store logs use console.error; same context-phrase style | ✓ |
| Log full payload | Full raw envelope for max debuggability | |

**User's choice:** console.error (matches repo convention)
**Notes:** Leading context phrase + offending `event` tag/snippet; no full-payload dump.

---

## the agent's Discretion

- Exact JSDoc wording, internal helper decomposition, and precise malformed-shape guard set.
- Representation of the 5 known event values (Set vs array vs switch).

## Deferred Ideas

None — discussion stayed within phase scope. JSON.parse of socket messages, reconnect/backoff, state application, and event dispatch were explicitly assigned to Phases 7–9.
