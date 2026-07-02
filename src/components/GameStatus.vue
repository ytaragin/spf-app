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

    <h1>Quarter: {{ gameState.quarter }} - Time Left: {{ formattedTimeRemaining }}</h1>
    <h1>Possession: {{ possessionTeam }} Position: {{ gameState.yard_line }}</h1>
    <h1>Down: {{ gameState.down }} - Yards to go: {{ yardsToGo }}</h1>

    <v-container>
      <v-row>
        <v-col cols="12">
          <v-row justify="space-between">
            <v-col>Home ({{ homeTeam }}): {{ gameState.home_score }}</v-col>
            <v-col>Away ({{ awayTeam }}): {{ gameState.away_score }}</v-col>
          </v-row>
        </v-col>
        <v-col cols="12">
          <FootballField
            :ballPosition="gameState.yard_line"
            :firstDownTarget="gameState.first_down_target"
          />
        </v-col>
      </v-row>
    </v-container>
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
