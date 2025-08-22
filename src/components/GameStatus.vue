<template>
    <div class="game-status">
        <h1> Quarter: {{ gameState.quarter }} - Time Left: {{ formattedTimeRemaining }}</h1>
        <h1> Possession: {{ possessionTeam }} Position: {{ gameState.yard_line }}</h1>
        <h1> Down: {{ gameState.down }} - Yards to go: {{ yardsToGo }} </h1>

        <v-container>
            <v-row>
                <v-col cols="12">
                    <v-row justify="space-between">
                        <v-col >Home ({{ homeTeam }}): {{ gameState.home_score }}</v-col>
                        <v-col >Away ({{ awayTeam }}): {{ gameState.away_score }}</v-col>
                    </v-row>
                </v-col>
                <v-col cols="12">
                    <FootballField  
                        :ballPosition="gameState.yard_line" 
                        :firstDownTarget="gameState.first_down_target"
                    />
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>
<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { useTeamsStore } from '../stores/teamStore'
import FootballField from './FootballField.vue';

const gameStore = useGameStore()
const teamsStore = useTeamsStore()

// Use store properties with proper reactivity
const gameState = computed(() => gameStore.gameState)
const homeTeam = computed(() => teamsStore.homeTeam)
const awayTeam = computed(() => teamsStore.awayTeam)

// Format time from seconds to MM:SS
const formattedTimeRemaining = computed(() => {
    const totalSeconds = parseInt(gameState.value.time_remaining) || 0
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

// Calculate yards to go for first down
const yardsToGo = computed(() => {
    return Math.max(0, gameState.value.first_down_target - gameState.value.yard_line)
})

// Get the team name for possession display
const possessionTeam = computed(() => {
    if (gameState.value.possession === 'Home') {
        return homeTeam.value
    } else if (gameState.value.possession === 'Away') {
        return awayTeam.value
    }
    return gameState.value.possession // fallback to original value
})

</script>

<style></style>
