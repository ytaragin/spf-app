<template>
    <h1>{{ title }}</h1>
    <h3>-{{ gameMsg }}</h3>
    <div class="team-lineup">

        <PlayerRow class="team-row" v-for="row in rowList" :active="active" :boxes="row" />
    </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue'
import PlayerRow from './PlayerRow.vue'
import { useTeamsStore } from '../stores/teamStore';
import { storeToRefs } from 'pinia';
import { useGameStore } from '../stores/gameStore';

export default defineComponent({
    components: {
        PlayerRow,
    },

    props: {
        active: Boolean,
        title: String,
        rows: {
            type: Array,
            required: true
        }
    },

    setup(props) {

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
            let a = props.rows;
            if (!props.active) {
                a = props.rows.slice().map(inner => inner.slice().reverse());
                a.reverse();
            }
            return a;
        })




        // Other setup logic

        // Return anything needed for the component
        return { rowList, playerPositions, gameMsg };
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
