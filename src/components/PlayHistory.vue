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
          :dot-color="playColor(play)"
          :icon="playIcon(play)"
          size="small"
        >
          <v-expansion-panels variant="accordion">
            <v-expansion-panel>
              <v-expansion-panel-title>
                <div class="d-flex align-center flex-wrap ga-3 w-100">
                  <span class="text-primary font-weight-bold">Play {{ index + 1 }}</span>
                  <span class="font-weight-medium">{{ play.new_state.possession }}</span>
                  <span class="text-medium-emphasis">Yard {{ play.new_state.yard_line }}</span>
                  <v-chip size="small" :color="playColor(play)" variant="tonal">
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
import { useTeamsStore } from '@/stores/teamStore'
import { storeToRefs } from 'pinia'
import PlayResultDetails from './PlayResultDetails.vue'
import { outcomeColor, outcomeIcon, outcomeSummary, managedTeamHadPossession } from '@/game/playOutcome.js'

defineOptions({ name: 'PlayHistory' })

const gameStore = useGameStore()
const teamsStore = useTeamsStore()
const { getAllPlayResults } = storeToRefs(gameStore)
const { managedTeam } = storeToRefs(teamsStore)

const playResults = computed(() => getAllPlayResults.value)

// Summary text for the chip, e.g. "Complete - 8 yards".
const formatPlayResult = (result) => outcomeSummary(result)

// Color from the managed team's perspective (turnover reads as success on defense).
const playColor = (play) =>
  outcomeColor(play.result, { favorable: managedTeamHadPossession(play, managedTeam.value) })

const playIcon = (play) => outcomeIcon(play.result)
</script>
