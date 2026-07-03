<script setup>
import { onMounted, computed } from 'vue'
import { useTheme } from 'vuetify'
import { storeToRefs } from 'pinia'
import { useGameStore } from '@/stores/gameStore'
import { useTeamsStore } from '@/stores/teamStore'
import GameLayout from '@/components/GameLayout.vue'
import GameStatus from '@/components/GameStatus.vue'

const gameStore = useGameStore()
const teamsStore = useTeamsStore()
const theme = useTheme()

const { error } = storeToRefs(gameStore)

// The snackbar is open whenever the store holds an error; closing it clears the error.
const showError = computed({
  get: () => error.value !== null,
  set: (value) => {
    if (!value) gameStore.clearError()
  }
})

onMounted(async () => {
  await Promise.all([teamsStore.fetchPlayers(), gameStore.fetchGame()])
})

const isDark = computed(() => theme.global.current.value.dark)

const toggleTheme = () => {
  theme.global.name.value = isDark.value ? 'light' : 'dark'
}
</script>

<template>
  <v-app-bar color="primary" density="comfortable" flat>
    <v-app-bar-title class="app-title flex-grow-0">Strat-Pro Football</v-app-bar-title>

    <v-spacer />

    <GameStatus />

    <v-spacer />

    <template #append>
      <v-btn
        :icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
        variant="text"
        :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="toggleTheme"
      ></v-btn>
    </template>
  </v-app-bar>

  <v-main>
    <v-container fluid>
      <GameLayout />
    </v-container>
  </v-main>

  <v-snackbar v-model="showError" color="error" location="bottom" :timeout="6000" multi-line>
    {{ error }}
    <template #actions>
      <v-btn variant="text" icon="mdi-close" @click="showError = false"></v-btn>
    </template>
  </v-snackbar>
</template>

<style scoped>
.app-title {
  /* Keep the title content-sized, but allow it to shrink and clip (ellipsis)
     so GameStatus gets priority on narrow screens. */
  flex-shrink: 1;
  min-width: 0;
  max-width: 260px;
}
</style>
