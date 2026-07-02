<template>
  <div class="game-status">
    <v-btn
      v-if="!showRawData"
      class="raw-data-toggle"
      icon="mdi-code-json"
      size="small"
      variant="tonal"
      color="grey-darken-1"
      title="Show raw data"
      @click="showRawData = true"
    ></v-btn>

    <v-navigation-drawer
      v-model="showRawData"
      location="right"
      temporary
      width="360"
    >
      <div class="raw-data-panel">
        <div class="raw-data-header">
          <h2>Raw Game Status</h2>
          <v-btn
            icon="mdi-close"
            size="x-small"
            variant="text"
            @click="showRawData = false"
          ></v-btn>
        </div>
        <pre class="raw-data-content">{{ rawGameState }}</pre>
      </div>
    </v-navigation-drawer>

    <v-card variant="outlined" class="scoreboard-card mb-3">
      <v-card-text>
        <v-row align="center" justify="space-between" class="mb-2">
          <v-col cols="12" sm="6">
            <div class="d-flex align-center ga-2 flex-wrap">
              <v-chip color="primary" variant="tonal" size="small">Q{{ gameState.quarter }}</v-chip>
              <v-chip variant="tonal" size="small">{{ formattedTimeRemaining }}</v-chip>
              <v-chip variant="tonal" size="small">{{ gameState.down }} & {{ yardsToGo }}</v-chip>
            </div>
          </v-col>
          <v-col cols="12" sm="6" class="text-sm-right">
            <span class="text-body-2">
              {{ possessionTeam }} ball at {{ gameState.yard_line }}
            </span>
          </v-col>
        </v-row>

        <v-row align="center" justify="space-between" class="text-h6">
          <v-col cols="6">Home ({{ homeTeam }}): {{ gameState.home_score }}</v-col>
          <v-col cols="6" class="text-right">Away ({{ awayTeam }}): {{ gameState.away_score }}</v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card variant="outlined" class="field-card mb-3">
      <v-card-text>
        <FootballField
          :ballPosition="gameState.yard_line"
          :firstDownTarget="gameState.first_down_target"
        />
      </v-card-text>
    </v-card>
  </div>
</template>
<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { useTeamsStore } from '../stores/teamStore'
import FootballField from './FootballField.vue'

const gameStore = useGameStore()
const teamsStore = useTeamsStore()

// Toggle for showing the raw game state data panel
const showRawData = ref(false)

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

<style>
.game-status {
  position: relative;
}

.raw-data-toggle {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 5;
  color: rgba(0, 0, 0, 0.6);
  background: rgba(255, 255, 255, 0.85);
}

.raw-data-panel {
  padding: 16px;
}

.raw-data-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.raw-data-header h2 {
  margin: 0;
  font-size: 1.1rem;
}

.raw-data-content {
  font-family: monospace;
  font-size: 0.85rem;
  white-space: pre-wrap;
  word-break: break-word;
  background: rgba(0, 0, 0, 0.05);
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
}
</style>
