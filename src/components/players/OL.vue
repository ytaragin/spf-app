

<template>
    <div>
        <v-card>
       OL 
        <SingleStat name="Blocks" :val="player.blocks"/>
        <SingleStat name="Pass Blocks" :val="player.pass_block"/>
        </v-card>
    </div>
</template>

<script setup>

import SingleStat from './SingleStat.vue'
    
    defineProps({
    player:Object,
  })
</script>
