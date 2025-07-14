<template>
    <div>
        <v-card>
            DL
            <v-container>
                <v-row>
                    <v-col>
                        <SingleStat name="Pass Rush" :val="player.pass_rush"/>
                        <SingleStat name="Tackles" :val="player.tackles"/>
                    </v-col>
                </v-row>
            </v-container>
        </v-card>
    </div>
</template>

<script setup>
import SingleStat from './SingleStat.vue'

defineProps({
    player: Object,
})

</script>
