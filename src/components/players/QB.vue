
<template>
    <div>
        <v-card>

        QB
        <SingleStat name="Endurance" :val="player.endurance"/>

        <v-container>
            <v-row > 
                <v-col>
                    <PassingStat title="Quick" :labels="passLabels" :stats="player.quick.stats" />
                    <PassingStat title="Short" :labels="passLabels" :stats="player.short.stats" />
                    <PassingStat title="Long" :labels="passLabels" :stats="player.long.stats" />
                </v-col>
                <v-col>
                    <NumberedStat title="Rushing" :values="player.rushing.stats" />
                </v-col>
            </v-row>
            <v-row > 
                <v-col>
                    <PassingStat title="Pass Rush" :labels="rushLabels" :stats="player.pass_rush.stats" />
                </v-col>
                <v-col>
                    <SingleStat name="Endurance Rushing" :val="player.endurance_rushing" />
                </v-col>
            </v-row>
        </v-container>
        </v-card>
    </div>
</template>

<script setup>
    import PassingStat from './PassingStat.vue'
import SingleStat from './SingleStat.vue'
import NumberedStat from './NumberedStat.vue'

import { ref } from 'vue';

const stats = {
  "Complete": "31-42",
  "Incomplete": "43-48",
  "Runs": "13-30",
  "Sack": "1-12",
};

const rushLabels = [
  { key: "Sack", value: "Sack", order: 1 },
  { key: "Runs", value: "Runs", order: 2 },
  { key: "Complete", value: "Com", order: 3 },
  { key: "Incomplete", value: "Inc", order: 4 },
];

const passLabels = [
  { key: "Complete", value: "Com", order: 1 },
  { key: "Incomplete", value: "Inc", order: 2 },
  { key: "Interception", value: "Int", order: 3 },
];
const orderedMap = [
  { key: "Complete", value: "Com", order: 1 },
  { key: "Runs", value: undefined, order: 2 },
  { key: "Sack", value: undefined, order: 3 },
];

    defineProps({
    player:Object,
  })

</script>
