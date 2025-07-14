<template>
    <div>
        <v-card>
            K
            <v-container>
                <v-row>
                    <v-col cols="8">
                        <SingleStat name="Extra Points" :val="player.extra_points"/>
                        <SingleStat name="Longest FG" :val="player.longest_fg"/>
                        <SingleStat name="Over Fifty" :val="player.over_fifty"/>
                    </v-col>
                    <v-col cols="4">
                        <RangedStat title="Field Goals" :labels="fieldGoalLabels" :stats="player.field_goals.stats" />
                    </v-col>
                </v-row>
            </v-container>
        </v-card>
    </div>
</template>

<script setup>
import RangedStat from './RangedStat.vue'
import SingleStat from './SingleStat.vue'

const fieldGoalLabels = [
  { key: "18-25", value: "18-25", order: 1 },
  { key: "26-35", value: "26-35", order: 2 },
  { key: "36-45", value: "36-45", order: 3 },
  { key: "46-50", value: "46-50", order: 4 },
];

defineProps({
    player: Object,
})

</script>
