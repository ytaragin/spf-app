
<template>
    <div class="game-layout">
        <GameStatus />

        <button @click="fetchGame2()" >Get Game Status</button>
        <TeamLineup v-if="!offenseActive" :active="offenseActive" title="Offensive Lineup" :isDefense="!trueval" />
        <button @click="getOtherTeamLineup()">Get Other Team Lineup</button>

        <TeamLineup :active="!offenseActive" title="Defensive Lineup" :isDefense="trueval" />

        <TeamLineup v-if="offenseActive" :active="offenseActive" title="Offensive Lineup" :isDefense="!trueval" />



        <button @click="toggleOffense">Switch Offense/Defense</button>
        <div>
            Managed team: {{ managedTeam }}
            <button @click="toggleTeam">Switch Managed Team</button>
        </div>

        <button @click="runPlay">Run Play</button>

    </div>
</template>
  
<script>

import { defineComponent, ref, computed } from 'vue'
import { SPFMetadata } from "../game/SPFMetadata.js"
import { useGameStore } from '@/stores/gameStore'
import { useTeamsStore } from '@/stores/teamStore'
import { storeToRefs } from 'pinia';

import TeamLineup from './TeamLineup.vue'
import GameStatus from './GameStatus.vue'

export default defineComponent({
    components: {
        TeamLineup,
        GameStatus,
    },

    setup(props) {
        const { game, setDefensiveLineup, fetchGame, setDefensivePlay } = storeToRefs(useGameStore());
        const teamsStore = useTeamsStore()
        const { getManagedTeam, toggleManagedTeam } = storeToRefs(teamsStore);
        const gamesStore = useGameStore();
        const fetchGame2 = useGameStore().fetchGame;


        const offenseActive = ref(true);
        const trueval = ref(true);


        const toggleOffense = () => {
            offenseActive.value = !offenseActive.value;

        }

        const managedTeam = computed(() => teamsStore.getManagedTeam())

        const toggleTeam = () => {
            teamsStore.toggleManagedTeam()
        }

        const getOtherTeamLineup = () => {
            gamesStore.getLineup(offenseActive.value);
        }

        const runPlay = () => {
            gamesStore.runPlay();
        }
        // const toggleManagedTeam = () => {
        //     switchManagedTeam()
        // }



        // return the properties and methods that you want to use in the template
        return {
            game,
            fetchGame,
            fetchGame2,
            offenseActive,
            toggleOffense,
            setDefensiveLineup,
            setDefensivePlay,
            trueval,
            toggleTeam,
            managedTeam, getManagedTeam,
            getOtherTeamLineup,
            runPlay
        };
    },


});

</script>

<style>
.game-layout {}
</style>
