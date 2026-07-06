<template>
  <PlayerStatCard title="QB">
    <div class="d-flex flex-wrap ga-1 mb-2">
      <SingleStat name="Endurance" :val="player.endurance" />
      <SingleStat name="Endurance Rushing" :val="player.endurance_rushing" />
    </div>

    <v-container class="pa-0">
      <v-row>
        <v-col>
          <RangedStat title="Quick" :labels="passLabels" :stats="player.quick.stats" />
          <RangedStat title="Short" :labels="passLabels" :stats="player.short.stats" />
          <RangedStat title="Long" :labels="passLabels" :stats="player.long.stats" />
        </v-col>
        <v-col>
          <RangedStat title="Pass Rush" :labels="rushLabels" :stats="player.pass_rush.stats" />
          <NumberedStat title="Rushing" :values="player.rushing.stats" />
        </v-col>
      </v-row>
    </v-container>
  </PlayerStatCard>
</template>

<script setup>
import PlayerStatCard from './PlayerStatCard.vue'
import RangedStat from './RangedStat.vue'
import SingleStat from './SingleStat.vue'
import NumberedStat from './NumberedStat.vue'

const rushLabels = [
  { key: 'Sack', value: 'Sack', order: 1 },
  { key: 'Runs', value: 'Runs', order: 2 },
  { key: 'Complete', value: 'Com', order: 3 },
  { key: 'Incomplete', value: 'Inc', order: 4 }
]

const passLabels = [
  { key: 'Complete', value: 'Com', order: 1 },
  { key: 'Incomplete', value: 'Inc', order: 2 },
  { key: 'Interception', value: 'Int', order: 3 }
]

defineProps({
  player: Object
})
</script>
