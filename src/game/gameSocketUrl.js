/**
 * WebSocket URL derivation.
 *
 * Derives the realtime WebSocket wire address from the REST base URL
 * (the same VITE_API_BASE_URL value the stores read). Pure — no Vue/store
 * access; the base URL is passed in by the caller, never read from
 * import.meta.env here.
 *
 * Fail loud (D-05): invalid, empty, or unset input throws — this function
 * never returns null and never silently defaults.
 */

const WS_PATHNAME = '/game/ws'

const PROTOCOL_MAP = {
  'http:': 'ws:',
  'https:': 'wss:'
}

/**
 * Derive the WebSocket URL from a REST base URL.
 *
 * Maps http:→ws: and https:→wss:, preserves host and port, and sets the
 * pathname to /game/ws (replacing any existing path and normalizing trailing
 * slashes via the URL constructor).
 *
 * @param {string} baseUrl - The REST base URL (e.g. 'http://localhost:8000').
 * @returns {string} The derived WebSocket URL (e.g. 'ws://localhost:8000/game/ws').
 * @throws {Error} When baseUrl is falsy, unparseable, or not http(s).
 */
export function toWebSocketUrl(baseUrl) {
  if (!baseUrl) {
    throw new Error(`Cannot derive WebSocket URL from empty base URL: ${baseUrl}`)
  }

  let url
  try {
    url = new URL(baseUrl)
  } catch {
    throw new Error(`Cannot derive WebSocket URL from invalid base URL: ${baseUrl}`)
  }

  const wsProtocol = PROTOCOL_MAP[url.protocol]
  if (!wsProtocol) {
    throw new Error(`Cannot derive WebSocket URL from non-http(s) base URL: ${baseUrl}`)
  }

  url.protocol = wsProtocol
  url.pathname = WS_PATHNAME

  return url.toString()
}
