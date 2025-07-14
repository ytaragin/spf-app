
<template>
    <div class="game-layout">
        <GameStatus />

        <v-btn @click="getOtherTeamLineup()">Get Other Team Lineup</v-btn>
        <v-btn @click="fetchGame2()">Get Game Status</v-btn>
        
        <PlaySelector :playType="currentPlayType" @update:playType="updatePlayType" />
        
        <PlayLineup :currentPlayType="currentPlayType" :offenseActive="offenseActive" />
        
        <v-btn @click="toggleOffense">Switch Offense/Defense</v-btn>
        <div>
            Managed team: {{ managedTeam }}
            <v-btn @click="toggleTeam">Switch Managed Team</v-btn>
        </div>

        <v-btn @click="runPlay" color="success" variant="elevated">Run Play</v-btn>

    </div>
</template>
  
<script>

import { defineComponent, ref, computed } from 'vue'
import { SPFMetadata } from "../game/SPFMetadata.js"
import { useGameStore } from '@/stores/gameStore'
import { useTeamsStore } from '@/stores/teamStore'
import { storeToRefs } from 'pinia';

import GameStatus from './GameStatus.vue'
import PlaySelector from './PlaySelector.vue'
import PlayLineup from './PlayLineup.vue'

export default defineComponent({
    components: {
        GameStatus,
        PlaySelector,
        PlayLineup
    },

    setup(props) {
        const { game, setDefensiveLineup, fetchGame, setDefensivePlay } = storeToRefs(useGameStore());
        const teamsStore = useTeamsStore()
        const { getManagedTeam, toggleManagedTeam } = storeToRefs(teamsStore);
        const gamesStore = useGameStore();
        const fetchGame2 = useGameStore().fetchGame;

        const offenseActive = ref(true);
        const currentPlayType = ref('standard');

        const updatePlayType = (playType) => {
            currentPlayType.value = playType.toLowerCase();
        };

        const toggleOffense = () => {
            offenseActive.value = !offenseActive.value;
        };

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
            toggleTeam,
            managedTeam, getManagedTeam,
            getOtherTeamLineup,
            runPlay,
            currentPlayType,
            updatePlayType
        };
    },


});

</script>

<style>
.game-layout {
    padding: 1rem;
}

.game-layout .v-btn {
    margin: 0.25rem;
}

.game-layout > div {
    margin: 0.5rem 0;
}
</style>
