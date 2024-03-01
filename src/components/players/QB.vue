
<template>
    <div>
        QB

        <v-card>
            <div class="mainstats"> 
                <PassingStat title="Rushing" :labels="orderedMap" :stats="stats" />
            </div>
            <SingleStat name="Endurance Rushing" :val="player.endurance_rushing" />
            <SingleStat name="Endurance" :val="player.endurance"/>
        </v-card>
    </div>
</template>

<script setup>
    import PassingStat from './PassingStat.vue'
import SingleStat from './SingleStat.vue'

import { ref } from 'vue';

const stats = {
  "Complete": "31-42",
  "Incomplete": "43-48",
  "Runs": "13-30",
  "Sack": "1-12",
};

const orderedMap = [
  { key: "Complete", value: "Com", order: 1 },
  { key: "Runs", value: undefined, order: 2 },
  { key: "Sack", value: undefined, order: 3 },
];

    defineProps({
    player:Object,
  })

</script>
