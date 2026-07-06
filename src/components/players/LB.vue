<template>
  <PlayerStatCard title="LB">
    <div class="d-flex flex-wrap ga-1">
      <SingleStat name="Intercepts" :val="player.intercepts" />
      <SingleStat name="Pass Def" :val="player.pass_def" />
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
