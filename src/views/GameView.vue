<script setup>
import { onMounted, computed } from 'vue'
import { useTheme } from 'vuetify'
import { useGameStore } from '@/stores/gameStore'
import { useTeamsStore } from '@/stores/teamStore'
import GameLayout from '@/components/GameLayout.vue'
import GameStatus from '@/components/GameStatus.vue'

const gameStore = useGameStore()
const teamsStore = useTeamsStore()
const theme = useTheme()

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
