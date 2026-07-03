<template>
  <div class="game-layout">
    <v-card variant="tonal" class="mb-3">
      <v-card-text class="d-flex align-center flex-wrap ga-3">
        <v-btn @click="toggleTeam">Switch Managed Team</v-btn>
        <div class="current-team-display">
          Managing: <span class="team-highlight">{{ managedTeam }} - {{ managedTeamName }}</span>
        </div>
        <div class="current-side-display">
          On: <span class="side-highlight">{{ currentSide }}</span>
        </div>
        <v-spacer />
        <div class="teams-display">Home: {{ homeTeamName }} | Away: {{ awayTeamName }}</div>

        <v-menu v-if="isDev" location="bottom end">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-wrench"
              size="small"
              variant="text"
              title="Developer tools"
            ></v-btn>
          </template>
          <v-list density="compact">
            <v-list-subheader>Developer Tools</v-list-subheader>
            <v-list-item title="Get Other Team Lineup" @click="getOtherTeamLineup()" />
            <v-list-item title="Get Game Status" @click="fetchGame(false)" />
            <v-list-item title="Full Sync" @click="fetchGame(true)" />
          </v-list>
        </v-menu>
      </v-card-text>
    </v-card>

    <v-row>
      <v-col cols="12" md="6">
        <v-card variant="outlined" class="field-card mb-3">
          <v-card-text>
            <FootballField
              :ballPosition="gameState.yard_line"
              :firstDownTarget="gameState.first_down_target"
            />
          </v-card-text>
        </v-card>
        <PlayHistory />
      </v-col>
      <v-col cols="12" md="6">
        <PlayTypeSelector />
        <PlayLineup :offenseActive="offenseActive" />
        <v-btn @click="runPlay" color="success" variant="elevated" block class="my-3">
          Run Play
        </v-btn>
        <PlayResult />
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { useTeamsStore } from '@/stores/teamStore'
import { storeToRefs } from 'pinia'

import FootballField from './FootballField.vue'
import PlayTypeSelector from './PlayTypeSelector.vue'
import PlayLineup from './PlayLineup.vue'
import PlayResult from './PlayResult.vue'
import PlayHistory from './PlayHistory.vue'

const { gameState } = storeToRefs(useGameStore())
const teamsStore = useTeamsStore()
const { managedTeam } = storeToRefs(teamsStore)
const gamesStore = useGameStore()

// Expose developer-only tooling when running in dev builds
const isDev = import.meta.env.DEV

const fetchGame = async (fullSync) => {
  await gamesStore.fetchGameData(fullSync)
}

const homeTeamName = computed(() => teamsStore.homeTeam)
const awayTeamName = computed(() => teamsStore.awayTeam)
const managedTeamName = computed(() => {
  return managedTeam.value === 'Home' ? homeTeamName.value : awayTeamName.value
})

// Calculate if offense is active based on possession
const offenseActive = computed(() => {
  const possession = gameState.value?.possession
  return managedTeam.value === possession
})

// Determine if managed team is on offense or defense using offenseActive
const currentSide = computed(() => {
  return offenseActive.value ? 'Offense' : 'Defense'
})

const toggleTeam = () => {
  teamsStore.toggleManagedTeam()
}

const getOtherTeamLineup = () => {
  gamesStore.getLineup(offenseActive.value)
}

const runPlay = async () => {
  await gamesStore.runPlay()
  // After running the play, fetch updated game state, play types and play result
  await gamesStore.fetchGameData(false)
}
</script>

<style>
.game-layout {
  padding: 1rem 1.25rem 2rem;
  margin: 0 auto;
  width: 100%;
  max-width: 1600px; /* give the app room to breathe on large screens */
}

@media (min-width: 1400px) {
  .game-layout {
    max-width: 1800px;
  }
}

.current-side-display {
  font-size: 1.1em;
  font-weight: 500;
}

.current-team-display {
  font-size: 1.1em;
  font-weight: 500;
}

.side-highlight {
  font-weight: bold;
  font-size: 1.2em;
  padding: 0.3rem 0.8rem;
  border-radius: 6px;
  background-color: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  border: 2px solid rgb(var(--v-theme-primary));
}

.team-highlight {
  font-weight: bold;
  font-size: 1.2em;
  padding: 0.3rem 0.8rem;
  border-radius: 6px;
  background-color: rgba(var(--v-theme-secondary), 0.12);
  color: rgb(var(--v-theme-secondary));
  border: 2px solid rgb(var(--v-theme-secondary));
}

.teams-display {
  font-size: 0.9em;
  opacity: 0.75;
}
</style>
