
<template>
    <div class="game-layout">
        <div class="team-management-section">
            <v-btn @click="toggleTeam">Switch Managed Team</v-btn>
            <div class="current-team-display">
                Managing: <span class="team-highlight">{{ managedTeam }} - {{ managedTeamName }}</span>
            </div>
            <div class="current-side-display">
                On: <span class="side-highlight">{{ currentSide }}</span>
            </div>
        </div>
        <div class="teams-display">
            Home: {{ homeTeamName }} | Away: {{ awayTeamName }}
        </div>

        <GameStatus />

        <v-btn @click="getOtherTeamLineup()">Get Other Team Lineup</v-btn>
        <v-btn @click="fetchGame2()">Get Game Status</v-btn>
        
        <PlayTypeSelector :playType="currentPlayType" @update:playType="updatePlayType" />
        
        <PlayLineup :offenseActive="offenseActive" />
        
        <v-btn @click="runPlay" color="success" variant="elevated">Run Play</v-btn>

        <PlayResult />

    </div>
</template>
  
<script>

import { defineComponent, ref, computed } from 'vue'
import { SPFMetadata } from "../game/SPFMetadata.js"
import { useGameStore } from '@/stores/gameStore'
import { useTeamsStore } from '@/stores/teamStore'
import { storeToRefs } from 'pinia';

import GameStatus from './GameStatus.vue'
import PlayTypeSelector from './PlayTypeSelector.vue'
import PlayLineup from './PlayLineup.vue'
import PlayResult from './PlayResult.vue'

export default defineComponent({
    components: {
        GameStatus,
        PlayTypeSelector,
        PlayLineup,
        PlayResult
    },

    setup(props) {
        const { game, gameState, setDefensiveLineup, fetchGame, setDefensivePlay } = storeToRefs(useGameStore());
        const teamsStore = useTeamsStore()
        const { managedTeam, getManagedTeam, toggleManagedTeam, homeTeam, awayTeam } = storeToRefs(teamsStore);
        const gamesStore = useGameStore();
        
        const fetchGame2 = async () => {
            await gamesStore.fetchGame();
            await gamesStore.fetchPlayTypes();
        };

        const currentPlayType = ref('standard');

        const updatePlayType = (playType) => {
            currentPlayType.value = playType.toLowerCase();
        };
        const homeTeamName = computed(() => teamsStore.homeTeam)
        const awayTeamName = computed(() => teamsStore.awayTeam)
        const managedTeamName = computed(() => {
            return managedTeam.value === 'Home' ? homeTeamName.value : awayTeamName.value
        })

        // Calculate if offense is active based on possession
        const offenseActive = computed(() => {
            const possession = gameState.value?.possession
            console.log(`Possession: ${possession} Managed Team: ${managedTeam.value}`)
            const isOffense = managedTeam.value === possession
            console.log(`Is Offense Active: ${isOffense}`)
            return isOffense
        })

        // Determine if managed team is on offense or defense using offenseActive
        const currentSide = computed(() => {
            const val = offenseActive.value ? 'Offense' : 'Defense'
            console.log(`Current Side: ${val}`)
            return val

        })

        const toggleTeam = () => {
            teamsStore.toggleManagedTeam()
        }

        const getOtherTeamLineup = () => {
            gamesStore.getLineup(offenseActive.value);
        }

        const runPlay = async () => {
            await gamesStore.runPlay();
            // After running the play, fetch updated game state, play types and play result
            await gamesStore.fetchGame();
            await gamesStore.fetchPlayTypes();
            await gamesStore.fetchPlayResult();
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
            setDefensiveLineup,
            setDefensivePlay,
            toggleTeam,
            managedTeam, 
            getManagedTeam,
            getOtherTeamLineup,
            runPlay,
            currentPlayType,
            updatePlayType,
            homeTeamName,
            awayTeamName,
            managedTeamName,
            currentSide
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

.current-side {
    font-size: 0.85em;
    font-weight: normal;
    margin-left: 0.5rem;
    color: #666;
}

.team-management-section {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 0.5rem 0;
}

.current-side-display {
    font-size: 1.1em;
    font-weight: 500;
    color: #333;
}

.current-team-display {
    font-size: 1.1em;
    font-weight: 500;
    color: #333;
}

.side-highlight {
    font-weight: bold;
    font-size: 1.2em;
    padding: 0.3rem 0.8rem;
    border-radius: 6px;
    background-color: #e3f2fd;
    color: #1976d2;
    border: 2px solid #1976d2;
}

.team-highlight {
    font-weight: bold;
    font-size: 1.2em;
    padding: 0.3rem 0.8rem;
    border-radius: 6px;
    background-color: #f3e5f5;
    color: #7b1fa2;
    border: 2px solid #7b1fa2;
}

.teams-display {
    font-size: 0.9em;
    color: #555;
    margin: 0.25rem 0;
    padding-left: 0.5rem;
}
</style>
