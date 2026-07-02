<template>
  <v-card v-if="playResult" variant="outlined" class="play-result mb-3">
    <v-card-title class="d-flex align-center justify-space-between py-2">
      <span class="text-subtitle-1">Play Result</span>
      <v-btn @click="refreshResult" size="small" variant="outlined">Refresh</v-btn>
    </v-card-title>
    <v-card-text>
      <div class="result-summary">
        <div class="result-type">
          <strong>Result Type:</strong> {{ playResult.result.result_type }}
        </div>
        <div class="result-value"><strong>Result:</strong> {{ playResult.result.result }} yards</div>
        <div class="time-elapsed"><strong>Time:</strong> {{ playResult.result.time }} seconds</div>
      </div>

      <div
        class="play-details"
        v-if="playResult.result.details && playResult.result.details.length > 0"
      >
        <h4 class="text-subtitle-2 mb-1">Play Details</h4>
        <ul>
          <li v-for="detail in playResult.result.details" :key="detail">
            {{ detail }}
          </li>
        </ul>
      </div>

      <div class="game-state-update">
        <h4 class="text-subtitle-2 mb-1">New Game State</h4>
        <div class="state-grid">
          <div class="state-item">
            <strong>Score:</strong>
            Home {{ playResult.new_state.home_score }} - {{ playResult.new_state.away_score }} Away
          </div>
          <div class="state-item"><strong>Quarter:</strong> {{ playResult.new_state.quarter }}</div>
          <div class="state-item">
            <strong>Time Remaining:</strong> {{ formatTime(playResult.new_state.time_remaining) }}
          </div>
          <div class="state-item">
            <strong>Possession:</strong> {{ playResult.new_state.possession }}
          </div>
          <div class="state-item"><strong>Down:</strong> {{ playResult.new_state.down }}</div>
          <div class="state-item">
            <strong>Yard Line:</strong> {{ playResult.new_state.yard_line }}
          </div>
          <div class="state-item">
            <strong>First Down Target:</strong> {{ playResult.new_state.first_down_target }}
          </div>
          <div class="state-item">
            <strong>Status:</strong> {{ playResult.new_state.last_status }}
          </div>
        </div>
      </div>

      <div class="mechanics" v-if="showMechanics && playResult.result.mechanic">
        <h4 class="text-subtitle-2 mb-1">Game Mechanics</h4>
        <div class="mechanic-details">
          <div v-for="mechanic in playResult.result.mechanic" :key="mechanic" class="mechanic-item">
            {{ mechanic }}
          </div>
        </div>
      </div>

      <div class="cards-info" v-if="playResult.result.cards">
        <h4 class="text-subtitle-2 mb-1">Cards Information</h4>
        <div class="cards-details">
          <div>
            <strong>Cards Flipped:</strong> {{ playResult.result.cards.cards_flipped.join(', ') }}
          </div>
          <div><strong>Had Z:</strong> {{ playResult.result.cards.had_z ? 'Yes' : 'No' }}</div>
        </div>
      </div>

      <v-btn @click="toggleMechanics" size="small" variant="text">
        {{ showMechanics ? 'Hide' : 'Show' }} Game Mechanics
      </v-btn>
    </v-card-text>
  </v-card>
  <v-card v-else variant="outlined" class="no-result mb-3">
    <v-card-text class="text-center py-8">
      <p class="text-medium-emphasis mb-3">No play result available</p>
      <v-btn @click="refreshResult" variant="outlined">Fetch Result</v-btn>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { storeToRefs } from 'pinia'

defineOptions({ name: 'PlayResult' })

const gameStore = useGameStore()
const { getPlayResult } = storeToRefs(gameStore)
const showMechanics = ref(false)

const playResult = computed(() => getPlayResult.value)

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const toggleMechanics = () => {
  showMechanics.value = !showMechanics.value
}

const refreshResult = async () => {
  await gameStore.fetchPlayResult()
}
</script>

<style scoped>
.result-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 4px;
}

.result-type {
  color: rgb(var(--v-theme-primary));
}

.result-value {
  color: rgb(var(--v-theme-success));
  font-weight: bold;
}

.play-details {
  margin: 1rem 0;
}

.play-details ul {
  margin: 0;
  padding-left: 1.5rem;
}

.play-details li {
  margin-bottom: 0.25rem;
}

.game-state-update {
  margin: 1rem 0;
}

.state-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 4px;
}

.state-item {
  padding: 0.25rem;
}

.mechanics {
  margin: 1rem 0;
  padding: 0.5rem;
  background-color: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 4px;
}

.mechanic-details {
  font-family: monospace;
  font-size: 0.9rem;
}

.mechanic-item {
  padding: 0.125rem 0;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.mechanic-item:last-child {
  border-bottom: none;
}

.cards-info {
  margin: 1rem 0;
  padding: 0.5rem;
  background-color: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 4px;
}

.cards-details div {
  margin-bottom: 0.25rem;
}
</style>
