<template>
  <v-card variant="outlined" class="play-selector mb-3">
    <v-card-title class="text-subtitle-1 py-2">Play Type</v-card-title>
    <v-card-text>
      <div v-if="nextPlayType" class="next-play-type mb-2">
        <span class="text-caption text-medium-emphasis me-1">Next Play Type:</span>
        <v-chip size="small" color="primary" variant="tonal">{{ nextPlayType }}</v-chip>
      </div>
      <v-btn-toggle
        v-model="selectedPlayType"
        color="primary"
        variant="outlined"
        divided
        mandatory
        @update:model-value="selectPlayType"
      >
        <v-btn v-for="playType in playTypes" :key="playType.value" :value="playType.value">
          {{ playType.label }}
        </v-btn>
      </v-btn-toggle>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useGameStore } from '../stores/gameStore'

defineOptions({ name: 'PlaySelector' })

const gameStore = useGameStore()

const selectedPlayType = ref('standard')

// Get nextPlayType from the game store
const nextPlayType = computed(() => gameStore.getNextPlayType)

// Computed property to map server play types to the format expected by the component
const playTypes = computed(() => {
  const storePlayTypes = gameStore.getPlayTypes

  // If no play types from store, fall back to defaults
  if (!storePlayTypes || storePlayTypes.length === 0) {
    return [
      { label: 'Standard Play', value: 'standard' },
      { label: 'Kickoff', value: 'kickoff' }
    ]
  }

  // Map server play types to component format
  return storePlayTypes.map((playType) => {
    if (typeof playType === 'string') {
      return { label: playType, value: playType }
    }
    return {
      label: playType.name || playType.label || playType,
      value: playType.value || playType.name || playType
    }
  })
})

const selectPlayType = (playType) => {
  if (!playType) return
  selectedPlayType.value = playType
  // Make server call to set the play type
  gameStore.setPlayType(playType)
}

// Watch for changes in playTypes and auto-select if only one option
const updateSelectedPlayType = () => {
  const availablePlayTypes = playTypes.value
  if (availablePlayTypes.length === 1) {
    const singlePlayType = availablePlayTypes[0].value
    if (selectedPlayType.value !== singlePlayType) {
      selectedPlayType.value = singlePlayType
    }
  }
}

// Fetch play types when component mounts
onMounted(() => {
  gameStore.fetchPlayTypes()
  // Check if we need to auto-select after initial fetch
  updateSelectedPlayType()
})

// Watch for changes in playTypes and update selection accordingly
watch(playTypes, () => {
  updateSelectedPlayType()
})
</script>
