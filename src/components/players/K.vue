<template>
  <PlayerStatCard title="K">
    <div class="d-flex flex-wrap ga-1 mb-2">
      <SingleStat name="Extra Points" :val="player.extra_points" />
      <SingleStat name="Longest FG" :val="player.longest_fg" />
      <SingleStat name="Over Fifty" :val="player.over_fifty" />
    </div>
    <RangedStat title="Field Goals" :labels="fieldGoalLabels" :stats="player.field_goals.stats" />
  </PlayerStatCard>
</template>

<script setup>
import PlayerStatCard from './PlayerStatCard.vue'
import RangedStat from './RangedStat.vue'
import SingleStat from './SingleStat.vue'

const fieldGoalLabels = [
  { key: '18-25', value: '18-25', order: 1 },
  { key: '26-35', value: '26-35', order: 2 },
  { key: '36-45', value: '36-45', order: 3 },
  { key: '46-50', value: '46-50', order: 4 }
]

defineProps({
  player: Object
})
</script>
