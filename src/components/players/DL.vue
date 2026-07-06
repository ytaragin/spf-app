<template>
  <PlayerStatCard title="DL">
    <div class="d-flex flex-wrap ga-1">
      <SingleStat name="Pass Rush" :val="player.pass_rush" />
      <SingleStat name="Tackles" :val="player.tackles" />
    </div>
  </PlayerStatCard>
</template>

<script setup>
import PlayerStatCard from './PlayerStatCard.vue'
import SingleStat from './SingleStat.vue'

defineProps({
  player: Object
})
</script>
