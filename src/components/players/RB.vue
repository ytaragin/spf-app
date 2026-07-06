<template>
  <PlayerStatCard title="RB">
    <div class="mainstats">
      <TripleStat title="Rushing" :labels="['N']" :stats="player.rushing.stats" />
      <TripleStat title="Pass Gain" :labels="['Q', 'S', 'L']" :stats="player.pass_gain.stats" />
    </div>
    <div class="d-flex flex-wrap ga-1 mt-2">
      <SingleStat name="Long Gain" :val="player.lg" />
      <SingleStat name="Blocks" :val="player.blocks" />
    </div>
  </PlayerStatCard>
</template>

<script setup>
import PlayerStatCard from './PlayerStatCard.vue'
import TripleStat from './TripleStat.vue'
import SingleStat from './SingleStat.vue'

defineProps({
  player: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
.mainstats {
  display: flex;
  gap: 12px;
}
</style>
