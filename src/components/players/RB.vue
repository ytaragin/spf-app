

<template>
    <div>
        RB
        <PlayerName :name="player.name" :team="player.team" />
        <div class="mainstats"> 
            <Stat title="Rushing" :labels="['N']" :stats="player.rushing.stats" />
            <Stat title="Pass Gain" :labels="[ 'Q', 'S', 'L']" :stats="player.pass_gain.stats" />
        </div>
        <SingleStat name="Long Gain" :val="player.lg" />
        <SingleStat name="Blocks" :val="player.blocks" />
    </div>
</template>

<script setup>
import PlayerName from './PlayerName.vue'
import Stat from './Stat.vue'
import SingleStat from './SingleStat.vue'

    defineProps({
  player: {
    type: Object,
    required: true
  },

})
</script>

<style >
.mainstats{
  display: flex;
}
</style>
