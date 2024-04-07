
<template>
    <div>
                    <v-card>
                        <div class="mainstats"> 
                            <TripleStat title="Rushing" :labels="['N']" :stats="player.rushing.stats" />
                            <TripleStat title="Pass Gain" :labels="[ 'Q', 'S', 'L']" :stats="player.pass_gain.stats" />
                        </div>
                        <SingleStat name="Long Rush" :val="player.long_rush" />
                        <SingleStat name="Blocks" :val="player.blocks" />
                    </v-card>

    </div>
</template>
 
<script setup>
import TripleStat from './TripleStat.vue'
import SingleStat from './SingleStat.vue'


    defineProps({
    player:Object,
  })
</script>




