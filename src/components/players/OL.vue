<template>
  <PlayerStatCard title="OL">
    <div class="d-flex flex-wrap ga-1">
      <SingleStat name="Blocks" :val="player.blocks" />
      <SingleStat name="Pass Blocks" :val="player.pass_block" />
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
