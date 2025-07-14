<template>
    <h1>{{ title }}</h1>
    <h3>-{{ gameMsg }}</h3>
    <div class="team-lineup">

        <PlayerRow class="team-row" v-for="row in rowList" :active="active" :boxes="row" />
    </div>
    <OffensePlaySelector v-if="active && !isDefense" />
    <DefensePlaySelector v-if="active && isDefense" />
</template>

<script>
import { defineComponent, ref, computed } from 'vue'
import PlayerRow from './PlayerRow.vue'
import { SPFMetadata } from "../game/SPFMetadata.js"
import { useTeamsStore } from '../stores/teamStore';
import { storeToRefs } from 'pinia';
import { useGameStore } from '../stores/gameStore';
import OffensePlaySelector from './OffensePlaySelector.vue';
import DefensePlaySelector from './DefensePlaySelector.vue';

export default defineComponent({
    components: {
        PlayerRow,
        OffensePlaySelector,
        DefensePlaySelector,
    },

    props: {
        active: Boolean,
        title: String,
        isDefense: Boolean,
    },

    setup(props) {

        let spfMetadata = new SPFMetadata();

        const rows = spfMetadata.getBoxLayout(props.isDefense);
        const { playerPositions } = storeToRefs(useTeamsStore());
        const gameStore = useGameStore();
        const { gameMsg } = storeToRefs(gameStore);



        // const fetchTeam = () => {
        //   console.log("fetchTeam Pressed");
        //   defenseStore.fetchPlayers();
        //   console.log("fetchTeam Was Pressed");

        // }

        // const fetchAPlayer = () => {
        //   console.log("fetchAPlayer Pressed");
        //   let res = defenseStore.getPlayerByID("DL-36");
        //   console.log(`res is ${res.name}`);

        // }

        const rowList = computed(() => {
            let a = rows;
            if (!props.active) {
                a = rows.slice().map(inner => inner.slice().reverse());
                a.reverse();
            }
            return a;
        })




        // Other setup logic

        // Return anything needed for the component
        return { rowList, rows, playerPositions, gameMsg };
    },

})
</script>

<style>
.team-lineup {
    display: flex;
    flex-direction: column;
}

.team-row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}
</style>
