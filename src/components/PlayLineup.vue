<template>
  <div class="play-lineup">
    <div class="play-type-info">
      <strong>Current Play Type:</strong> {{ nextPlayType || 'Not set' }}
    </div>
    <!-- Team Lineup Section - Show when lineup hasn't been submitted -->
    <TeamLineup
      v-if="!offenseActive"
      :active="offenseActive"
      title="Offensive Lineup"
      :rows="offenseRows"
    />
    <TeamLineup :active="!offenseActive" title="Defensive Lineup" :rows="defenseRows" />
    <TeamLineup
      v-if="offenseActive"
      :active="offenseActive"
      title="Offensive Lineup"
      :rows="offenseRows"
    />

    <v-btn @click="submitLineup" color="success" variant="elevated">Submit Lineup</v-btn>

    <!-- Play Selector Section - Show after lineup is submitted -->
    <v-card v-if="lineupSubmitted" variant="outlined" class="play-selector-section">
      <v-card-title class="text-subtitle-1 py-2">Select Play</v-card-title>
      <v-card-text>
        <component v-if="getPlaySelector" :is="getPlaySelector" :active="true" />
        <div v-else class="text-medium-emphasis">Loading play selector...</div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useTeamsStore } from '../stores/teamStore'
import { useGameStore } from '../stores/gameStore'
import { SPFMetadata } from '../game/SPFMetadata.js'
import TeamLineup from './TeamLineup.vue'
import OffensePlaySelector from './PlaySelectors/OffensePlaySelector.vue'
import DefensePlaySelector from './PlaySelectors/DefensePlaySelector.vue'
import KickoffPlaySelector from './PlaySelectors/KickoffPlaySelector.vue'

defineOptions({ name: 'PlayLineup' })

const props = defineProps({
  offenseActive: {
    type: Boolean,
    required: true
  }
})

const { playerPositions } = storeToRefs(useTeamsStore())
const gameStore = useGameStore()
const { getNextPlayType } = storeToRefs(gameStore)
const spfMetadata = new SPFMetadata()

// State to track if lineup has been submitted
const lineupSubmitted = ref(false)

const nextPlayType = computed(() => getNextPlayType.value)

// Get layout rows based on play type
const playLayout = computed(() => {
  if (!nextPlayType.value) {
    return { offense: [], defense: [] }
  }
  return spfMetadata.getBoxLayoutForPlay(nextPlayType.value)
})

const offenseRows = computed(() => {
  return playLayout.value.offense
})

const defenseRows = computed(() => {
  return playLayout.value.defense
})

// Computed property to get the appropriate play selector component
const getPlaySelector = computed(() => {
  // Return null if no play type is available yet
  if (!nextPlayType.value) {
    return null
  }

  // For kickoff plays, show KickoffPlaySelector only when offense is active
  if (nextPlayType.value === 'Kickoff') {
    return props.offenseActive ? KickoffPlaySelector : null
  }
  // Return the appropriate selector based on which side is active
  return props.offenseActive ? OffensePlaySelector : DefensePlaySelector
})

const submitLineup = () => {
  // Get the appropriate layout based on offense/defense and play type
  const isDefense = !props.offenseActive
  const rows = isDefense ? playLayout.value.defense : playLayout.value.offense
  const spots = rows.flat()

  const obj = spots.reduce((accumulator, current) => {
    const p = playerPositions.value[current]
    const md = spfMetadata.getPositionMetaData(current)
    let id = p ? p.id : null

    if (md.allowMultiple) {
      if (id) {
        id = [id]
      } else {
        id = []
      }
    }

    accumulator[current] = id
    return accumulator
  }, {})

  gameStore.setLineup(obj, isDefense)

  // Mark lineup as submitted to proceed to next step
  lineupSubmitted.value = true
}
</script>

<style scoped>
.play-lineup {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
