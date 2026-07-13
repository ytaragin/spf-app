/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    server: {
      deps: {
        // Vuetify ships component CSS imports that Vitest cannot resolve when
        // externalized; inlining lets Vitest transform them (needed by the
        // createTestVuetify factory in test/setup.js).
        inline: ['vuetify']
      }
    },
    coverage: {
      provider: 'v8',
      all: true,
      reporter: ['text', 'html'],
      include: ['src/**'],
      exclude: ['src/main.js', 'src/stores/counter.js', 'src/**/*.test.{js,jsx}', 'test/**']
    }
  }
})
