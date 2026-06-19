<script setup>
import { onMounted } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { useTeamsStore } from '@/stores/teamStore'
import GameLayout from '@/components/GameLayout.vue'

const gameStore = useGameStore()
const teamsStore = useTeamsStore()

onMounted(async () => {
  await Promise.all([teamsStore.fetchPlayers(), gameStore.fetchGame()])
})
</script>

<template>
  <GameLayout />
</template>
