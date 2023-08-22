<template>
    <div class="game-status">
        <h1> Home ({{ homeTeam }}): {{ gameState.home_score }} - Away ({{ awayTeam }}): {{ gameState.away_score }}</h1>
        <h1> Quarter: {{ gameState.quarter }} - Time Left: {{ gameState.time_remaining }}</h1>
        <h1> Possession: {{ gameState.possession }} Position: {{ gameState.yard_line }}</h1>



    </div>
</template>
<script>

import { defineComponent, ref } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { storeToRefs } from 'pinia';
import { useTeamsStore } from '../stores/teamStore';

export default defineComponent({
    components: {
    },

    setup(props) {
        const { gameState } = storeToRefs(useGameStore());
        const { homeTeam, awayTeam } = storeToRefs(useTeamsStore());

        // const homeTeam = computed(() => )




        // return the properties and methods that you want to use in the template
        return {
            gameState,
            homeTeam,
            awayTeam,
        };
    },


});

</script>

<style></style>
