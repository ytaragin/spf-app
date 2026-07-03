<template>
  <div class="kickoff-play-selector">
    <v-card class="pa-4" variant="outlined">
      <v-card-title>Kickoff Options</v-card-title>
      <v-card-text>
        <v-radio-group v-model="onsideEnabled" inline class="kickoff-radio-group">
          <div :class="['kickoff-radio-wrapper', { selected: onsideEnabled === false }]">
            <v-radio
              label="Normal Kick"
              :value="false"
              class="kickoff-radio"
              color="success"
            ></v-radio>
          </div>
          <div :class="['kickoff-radio-wrapper', { selected: onsideEnabled === true }]">
            <v-radio
              label="Onside Kick"
              :value="true"
              class="kickoff-radio"
              color="warning"
            ></v-radio>
          </div>
        </v-radio-group>
      </v-card-text>
      <v-card-actions>
        <v-btn @click="submitPlay" color="primary" variant="elevated">Submit Play</v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useGameStore } from '@/stores/gameStore'

defineOptions({ name: 'KickoffPlaySelector' })

defineProps({
  active: {
    type: Boolean,
    default: true
  }
})

const gameStore = useGameStore()

// Default to normal kick (onside OFF)
const onsideEnabled = ref(false)

const submitPlay = () => {
  // Store the kickoff play settings
  const kickoffPlay = {
    type: 'kickoff',
    onside: onsideEnabled.value
  }

  // You may need to add a method to gameStore to handle kickoff plays
  // For now, we'll use a generic setPlay method or extend the store
  if (gameStore.setKickoffPlay) {
    gameStore.setKickoffPlay(kickoffPlay)
  } else {
    // Fallback - you might need to add this method to your game store
    console.warn(
      'gameStore.setKickoffPlay not available, kickoff play not submitted:',
      kickoffPlay
    )
  }
}
</script>

<style scoped>
.kickoff-play-selector {
  margin-top: 1rem;
}

.kickoff-radio-group {
  display: flex;
  gap: 2rem;
  justify-content: center;
  margin: 1rem 0;
}

.kickoff-radio-wrapper {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
  border: 2px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.3s ease;
  min-width: 140px;
  text-align: center;
  cursor: pointer;
}

.kickoff-radio-wrapper:hover {
  border-color: rgba(var(--v-theme-on-surface), 0.24);
  background-color: rgba(var(--v-theme-on-surface), 0.08);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Clear visual indication for selected state (Normal Kick = success) */
.kickoff-radio-wrapper.selected {
  background-color: rgba(var(--v-theme-success), 0.15);
  border-color: rgb(var(--v-theme-success));
  border-width: 3px;
  box-shadow: 0 0 0 2px rgba(var(--v-theme-success), 0.3);
  transform: scale(1.02);
}

.kickoff-radio-wrapper.selected :deep(.v-label) {
  color: rgb(var(--v-theme-success));
  font-weight: 700;
}

/* Onside Kick = warning when selected */
.kickoff-radio-wrapper:last-child.selected {
  background-color: rgba(var(--v-theme-warning), 0.15);
  border-color: rgb(var(--v-theme-warning));
  box-shadow: 0 0 0 2px rgba(var(--v-theme-warning), 0.3);
}

.kickoff-radio-wrapper:last-child.selected :deep(.v-label) {
  color: rgb(var(--v-theme-warning));
}

.kickoff-radio {
  width: 100%;
}

/* Make the radio buttons more prominent */
.kickoff-radio :deep(.v-selection-control__input) {
  transform: scale(1.2);
}

.kickoff-radio :deep(.v-label) {
  font-size: 1.1rem;
  margin-left: 0.5rem;
}
</style>
