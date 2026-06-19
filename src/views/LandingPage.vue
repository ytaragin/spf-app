<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTeamsStore } from '@/stores/teamStore'
import { storeToRefs } from 'pinia'

const router = useRouter()
const teamsStore = useTeamsStore()
const { homeTeam, awayTeam, isLoading } = storeToRefs(teamsStore)
const loadError = ref(false)

onMounted(async () => {
  try {
    await teamsStore.fetchPlayers()
  } catch {
    loadError.value = true
  }
})

const startGame = () => {
  router.push('/game')
}
</script>

<template>
  <div class="landing-page">
    <v-container class="landing-container">
      <v-card class="landing-card" elevation="8">
        <v-card-title class="landing-title">Strat-Pro Football</v-card-title>
        <v-card-subtitle class="landing-subtitle">Simulation Game</v-card-subtitle>

        <v-card-text>
          <div v-if="isLoading" class="loading-section">
            <v-progress-circular indeterminate color="primary" />
            <p>Loading teams...</p>
          </div>

          <div v-else-if="loadError" class="error-section">
            <p>Could not connect to the game server.</p>
            <v-btn variant="outlined" @click="teamsStore.fetchPlayers()">Retry</v-btn>
          </div>

          <div v-else class="matchup-section">
            <div class="team-matchup">
              <div class="team home-team">
                <div class="team-label">Home</div>
                <div class="team-name">{{ homeTeam || 'TBD' }}</div>
              </div>
              <div class="vs-divider">VS</div>
              <div class="team away-team">
                <div class="team-label">Away</div>
                <div class="team-name">{{ awayTeam || 'TBD' }}</div>
              </div>
            </div>
          </div>
        </v-card-text>

        <v-card-actions class="landing-actions">
          <v-btn
            color="success"
            size="x-large"
            variant="elevated"
            :disabled="isLoading || loadError"
            @click="startGame"
          >
            Play
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-container>
  </div>
</template>

<style scoped>
.landing-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.landing-container {
  max-width: 600px;
}

.landing-card {
  text-align: center;
  padding: 2rem 1rem;
}

.landing-title {
  font-size: 2rem;
  font-weight: bold;
}

.landing-subtitle {
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.loading-section,
.error-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem 0;
}

.matchup-section {
  padding: 1.5rem 0;
}

.team-matchup {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
}

.team {
  text-align: center;
}

.team-label {
  font-size: 0.85rem;
  text-transform: uppercase;
  opacity: 0.7;
  margin-bottom: 0.25rem;
}

.team-name {
  font-size: 1.4rem;
  font-weight: bold;
}

.vs-divider {
  font-size: 1.2rem;
  font-weight: bold;
  opacity: 0.5;
}

.landing-actions {
  justify-content: center;
  padding-bottom: 1.5rem;
}
</style>
