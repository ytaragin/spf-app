<template>
  <v-card variant="outlined" class="offense-play-selector">
    <v-card-title class="text-subtitle-1 py-2">Offensive Play</v-card-title>
    <v-card-text>
      <v-select v-model="selectedPlay" :items="plays" label="Choose Play" density="compact">
      </v-select>

      <v-select v-model="targetBox" :items="boxes" label="Target Box" density="compact"> </v-select>

      <v-btn color="primary" @click="submitPlay">Submit Play</v-btn>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, watch } from 'vue'
import { SPFMetadata } from '@/game/SPFMetadata.js'
import { useGameStore } from '@/stores/gameStore'

defineProps({
  active: Boolean
})

const gamesStore = useGameStore()
const getPlayer = gamesStore.getPlayer

const spfMetadata = new SPFMetadata()
const plays = spfMetadata.getOffensivePlayNames()

const boxes = ref([])
const selectedPlay = ref(null)
const targetBox = ref(null)

watch(selectedPlay, (newValue) => {
  boxes.value = spfMetadata.getBoxesPerPlay(newValue).filter((box) => getPlayer(box))
})

const submitPlay = () => {
  const info = spfMetadata.getOffensePlayInfo(selectedPlay.value)
  gamesStore.setOffensivePlay({
    play_type: info.code,
    strategy: 'NoStrategy',
    target: targetBox.value.toUpperCase()
  })
}
</script>
