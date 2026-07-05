<template>
  <PlayerStatCard title="DL">
    <v-container>
      <v-row>
        <v-col>
          <SingleStat name="Pass Rush" :val="player.pass_rush" />
          <SingleStat name="Tackles" :val="player.tackles" />
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
