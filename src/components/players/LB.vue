<template>
    <div>
        <v-card>
            LB
            <v-container>
                <v-row>
                    <v-col cols="8">
                        <SingleStat name="Intercepts" :val="player.intercepts"/>
                        <SingleStat name="Pass Def" :val="player.pass_def"/>
                    </v-col>
                    <v-col cols="4">
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
