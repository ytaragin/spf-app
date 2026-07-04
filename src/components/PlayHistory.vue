<template>
  <v-card variant="outlined" class="play-history mb-3">
    <v-card-title class="text-subtitle-1 py-2">Play History</v-card-title>
    <v-card-text>
      <div v-if="playResults.length === 0" class="text-medium-emphasis text-center py-4">
        No plays yet
      </div>
      <v-timeline
        v-else
        side="end"
        align="start"
        density="compact"
        truncate-line="both"
      >
        <v-timeline-item
          v-for="(play, index) in playResults"
          :key="index"
          :dot-color="resultColor(play.result)"
          :icon="resultIcon(play.result)"
          size="small"
        >
          <v-expansion-panels variant="accordion">
            <v-expansion-panel>
              <v-expansion-panel-title>
                <div class="d-flex align-center flex-wrap ga-3 w-100">
                  <span class="text-primary font-weight-bold">Play {{ index + 1 }}</span>
                  <span class="font-weight-medium">{{ play.new_state.possession }}</span>
                  <span class="text-medium-emphasis">Yard {{ play.new_state.yard_line }}</span>
                  <v-chip size="small" :color="resultColor(play.result)" variant="tonal">
                    {{ formatPlayResult(play.result) }}
                  </v-chip>
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <PlayResultDetails :play="play" />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-timeline-item>
      </v-timeline>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { storeToRefs } from 'pinia'
import PlayResultDetails from './PlayResultDetails.vue'

defineOptions({ name: 'PlayHistory' })

const gameStore = useGameStore()
const { getAllPlayResults } = storeToRefs(gameStore)

const playResults = computed(() => getAllPlayResults.value)

const formatPlayResult = (result) => {
  if (result.result_type === 'TurnOver') {
    return `Turnover - ${result.result} yards`
  }
  // Add more result type formatting as needed
  return `${result.result_type} - ${result.result} yards`
}

const resultColor = (result) => {
  if (result.result_type === 'TurnOver') {
    return 'error'
  }
  return 'success'
}

const resultIcon = (result) => {
  if (result.result_type === 'TurnOver') {
    return 'mdi-alert-octagon'
  }
  if (Number(result.result) > 0) {
    return 'mdi-arrow-up-bold'
  }
  return 'mdi-football'
}
</script>
