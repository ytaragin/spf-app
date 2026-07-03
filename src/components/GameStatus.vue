<template>
  <div class="game-status d-flex align-center ga-2">
    <!-- Compact scoreboard -->
    <div class="d-flex align-center ga-1">
      <span class="text-body-2 font-weight-medium d-none d-md-inline">{{ homeTeam }}</span>
      <span class="text-h6 font-weight-bold">{{ gameState.home_score }}</span>
      <span class="text-disabled">-</span>
      <span class="text-h6 font-weight-bold">{{ gameState.away_score }}</span>
      <span class="text-body-2 font-weight-medium d-none d-md-inline">{{ awayTeam }}</span>
    </div>

    <v-divider vertical class="mx-1" />

    <!-- Clock / quarter -->
    <v-chip size="small" variant="flat" color="surface">Q{{ gameState.quarter }}</v-chip>
    <v-chip size="small" variant="flat" color="surface">{{ formattedTimeRemaining }}</v-chip>

    <v-divider vertical class="mx-1 d-none d-sm-flex" />

    <!-- Down & distance + ball position -->
    <v-chip size="small" variant="flat" color="surface" class="d-none d-sm-flex">
      {{ gameState.down }} &amp; {{ yardsToGo }}
    </v-chip>
    <v-chip
      size="small"
      variant="outlined"
      class="d-none d-lg-flex"
      :title="`${possessionTeam} ball at the ${gameState.yard_line}`"
    >
      {{ possessionTeam }} @ {{ gameState.yard_line }}
    </v-chip>

    <!-- Raw data popover -->
    <v-menu :close-on-content-click="false" location="bottom end">
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          icon="mdi-code-json"
          size="small"
          variant="text"
          title="Show raw data"
        ></v-btn>
      </template>
      <v-card width="360" max-height="70vh" class="raw-data-card">
        <div class="raw-data-header">
          <span class="text-subtitle-2">Raw Game Status</span>
        </div>
        <pre class="raw-data-content">{{ rawGameState }}</pre>
      </v-card>
    </v-menu>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { useTeamsStore } from '../stores/teamStore'

const gameStore = useGameStore()
const teamsStore = useTeamsStore()

// Use store properties with proper reactivity
const gameState = computed(() => gameStore.gameState)
const homeTeam = computed(() => teamsStore.homeTeam)
const awayTeam = computed(() => teamsStore.awayTeam)

// Pretty-printed raw game state for the data panel
const rawGameState = computed(() => JSON.stringify(gameState.value, null, 2))

// Format time from seconds to MM:SS
const formattedTimeRemaining = computed(() => {
  const totalSeconds = parseInt(gameState.value.time_remaining) || 0
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

// Calculate yards to go for first down
const yardsToGo = computed(() => {
  return Math.max(0, gameState.value.first_down_target - gameState.value.yard_line)
})

// Get the team name for possession display
const possessionTeam = computed(() => {
  if (gameState.value.possession === 'Home') {
    return homeTeam.value
  } else if (gameState.value.possession === 'Away') {
    return awayTeam.value
  }
  return gameState.value.possession // fallback to original value
})
</script>

<style scoped>
.game-status {
  min-width: 0;
}

.raw-data-card {
  overflow-y: auto;
}

.raw-data-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 0;
}

.raw-data-content {
  font-family: monospace;
  font-size: 0.85rem;
  white-space: pre-wrap;
  word-break: break-word;
  background: rgba(var(--v-theme-on-surface), 0.05);
  padding: 12px;
  margin: 12px 16px 16px;
  border-radius: 4px;
  overflow-x: auto;
}
</style>
