<template>
    <div class="game-status">
        <h1> Quarter: {{ gameState.quarter }} - Time Left: {{ gameState.time_remaining }}</h1>
        <h1> Possession: {{ gameState.possession }} Position: {{ gameState.yard_line }}</h1>

        <v-container>
            <v-row>
                <v-col cols="12">
                    <v-row justify="space-between">
                        <v-col >Home ({{ homeTeam }}): {{ gameState.home_score }}</v-col>
                        <v-col >Away ({{ awayTeam }}): {{ gameState.away_score }}</v-col>
                    </v-row>
                </v-col>
                <v-col cols="12">
                    <FootballField  :ballPosition="gameState.yard_line" />
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>
<script setup>
    import { ref } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { useTeamsStore } from '../stores/teamStore'
import FootballField from './FootballField.vue';

const gameState = ref(useGameStore().gameState)
const homeTeam = ref(useTeamsStore().homeTeam)
const awayTeam = ref(useTeamsStore().awayTeam)

</script>

<style></style>
