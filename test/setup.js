import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// jsdom omits APIs Vuetify assumes exist — register no-op shims so component
// mounts (Phase 4) do not throw.
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false
    }
  })
}

if (globalThis.CSS && !globalThis.CSS.supports) {
  globalThis.CSS.supports = () => false
}

// Per-mount Vuetify plugin factory for component tests (consumed in Phase 4).
export function createTestVuetify() {
  return createVuetify({ components, directives })
}
