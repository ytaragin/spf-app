<template>
  <PlayerStatCard title="OL">
    <SingleStat name="Blocks" :val="player.blocks" />
    <SingleStat name="Pass Blocks" :val="player.pass_block" />
  </PlayerStatCard>
</template>

<script setup>
import PlayerStatCard from './PlayerStatCard.vue'
import SingleStat from './SingleStat.vue'

defineProps({
  player: Object
})
</script>
