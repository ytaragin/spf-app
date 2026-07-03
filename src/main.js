import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { md1 } from 'vuetify/blueprints'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

const vuetify = createVuetify({
  components,
  directives,
  blueprint: md1,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          background: '#f5f5f5',
          surface: '#ffffff',
          primary: '#1976d2',
          secondary: '#7b1fa2',
          success: '#2e7d32',
          warning: '#ed6c02',
          error: '#c62828',
          info: '#0288d1',
          // Domain-specific tokens
          offense: '#2e7d32',
          defense: '#1565c0',
          home: '#1976d2',
          away: '#c62828',
          firstDown: '#f9a825'
        }
      },
      dark: {
        dark: true,
        colors: {
          background: '#121212',
          surface: '#1e1e1e',
          primary: '#64b5f6',
          secondary: '#ce93d8',
          success: '#66bb6a',
          warning: '#ffa726',
          error: '#ef5350',
          info: '#29b6f6',
          // Domain-specific tokens
          offense: '#66bb6a',
          defense: '#42a5f5',
          home: '#64b5f6',
          away: '#ef5350',
          firstDown: '#ffca28'
        }
      }
    }
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi
    }
  }
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)

app.mount('#app')
