<template>
  <v-card variant="outlined" class="defense-play-selector">
    <v-card-title class="text-subtitle-1 py-2">Defensive Play</v-card-title>
    <v-card-text>
      <v-select
        v-model="selectedPlay"
        :items="playOptions"
        item-title="title"
        item-value="value"
        label="Choose Defensive Play"
        density="compact"
      >
      </v-select>

      <v-select v-model="targetBox" :items="boxes" label="Target Box" density="compact"> </v-select>

      <v-btn color="primary" :loading="isSubmittingPlay" @click="submitPlay">Submit Play</v-btn>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { SPFMetadata } from '../../game/SPFMetadata.js'
import { useGameStore } from '@/stores/gameStore'

defineProps({
  active: Boolean
})

const gamesStore = useGameStore()
const { isSubmittingPlay } = storeToRefs(gamesStore)

const spfMetadata = new SPFMetadata()
const plays = spfMetadata.getDefensivePlayNames()
// Defensive play options with description for v-select
const playOptions = plays.map((code) => {
  const info = spfMetadata.getDefensePlayInfo(code)
  return {
    title: info.description || code,
    value: code
  }
})
const boxes = ref([])
const selectedPlay = ref(null)
const targetBox = ref(null)

watch(selectedPlay, (newValue) => {
  if (!newValue) {
    boxes.value = []
    return
  }
  const playInfo = spfMetadata.getDefensePlayInfo(newValue)
  boxes.value = playInfo.boxes.filter((box) => gamesStore.getPlayer(box))
})

const submitPlay = () => {
  const info = spfMetadata.getDefensePlayInfo(selectedPlay.value)
  const req = {
    defense_type: info.code,
    strategy: 'Straight',
    def_players: []
  }

  if (targetBox.value) {
    req.key = targetBox.value.toUpperCase()
  }
  gamesStore.setDefensivePlay(req)
}
</script>
