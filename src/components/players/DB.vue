<template>
  <PlayerStatCard title="DB">
    <v-container>
      <v-row>
        <v-col cols="8">
          <SingleStat name="Intercepts" :val="player.intercepts" />
          <SingleStat name="Pass Def" :val="player.pass_def" />
        </v-col>
        <v-col cols="4">
          <SingleStat name="Pass Rush" :val="player.pass_rush" />
        </v-col>
      </v-row>
    </v-container>
  </PlayerStatCard>
</template>

<script setup>
import PlayerStatCard from './PlayerStatCard.vue'
import SingleStat from './SingleStat.vue'

defineProps({
  player: Object
})
</script>
