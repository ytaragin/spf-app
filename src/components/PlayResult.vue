<template>
    <div class="play-result" v-if="playResult">
        <div class="play-result-header">
            <h3>Play Result</h3>
            <v-btn @click="refreshResult" size="small" variant="outlined">Refresh</v-btn>
        </div>
        
        <div class="result-summary">
            <div class="result-type">
                <strong>Result Type:</strong> {{ playResult.result.result_type }}
            </div>
            <div class="result-value">
                <strong>Result:</strong> {{ playResult.result.result }} yards
            </div>
            <div class="time-elapsed">
                <strong>Time:</strong> {{ playResult.result.time }} seconds
            </div>
        </div>

        <div class="play-details" v-if="playResult.result.details && playResult.result.details.length > 0">
            <h4>Play Details</h4>
            <ul>
                <li v-for="detail in playResult.result.details" :key="detail">
                    {{ detail }}
                </li>
            </ul>
        </div>

        <div class="game-state-update">
            <h4>New Game State</h4>
            <div class="state-grid">
                <div class="state-item">
                    <strong>Score:</strong> 
                    Home {{ playResult.new_state.home_score }} - {{ playResult.new_state.away_score }} Away
                </div>
                <div class="state-item">
                    <strong>Quarter:</strong> {{ playResult.new_state.quarter }}
                </div>
                <div class="state-item">
                    <strong>Time Remaining:</strong> {{ formatTime(playResult.new_state.time_remaining) }}
                </div>
                <div class="state-item">
                    <strong>Possession:</strong> {{ playResult.new_state.possession }}
                </div>
                <div class="state-item">
                    <strong>Down:</strong> {{ playResult.new_state.down }}
                </div>
                <div class="state-item">
                    <strong>Yard Line:</strong> {{ playResult.new_state.yard_line }}
                </div>
                <div class="state-item">
                    <strong>First Down Target:</strong> {{ playResult.new_state.first_down_target }}
                </div>
                <div class="state-item">
                    <strong>Status:</strong> {{ playResult.new_state.last_status }}
                </div>
            </div>
        </div>

        <div class="mechanics" v-if="showMechanics && playResult.result.mechanic">
            <h4>Game Mechanics</h4>
            <div class="mechanic-details">
                <div v-for="mechanic in playResult.result.mechanic" :key="mechanic" class="mechanic-item">
                    {{ mechanic }}
                </div>
            </div>
        </div>

        <div class="cards-info" v-if="playResult.result.cards">
            <h4>Cards Information</h4>
            <div class="cards-details">
                <div><strong>Cards Flipped:</strong> {{ playResult.result.cards.cards_flipped.join(', ') }}</div>
                <div><strong>Had Z:</strong> {{ playResult.result.cards.had_z ? 'Yes' : 'No' }}</div>
            </div>
        </div>

        <v-btn @click="toggleMechanics" size="small" variant="text">
            {{ showMechanics ? 'Hide' : 'Show' }} Game Mechanics
        </v-btn>
    </div>
    <div v-else class="no-result">
        <p>No play result available</p>
        <v-btn @click="refreshResult" variant="outlined">Fetch Result</v-btn>
    </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { storeToRefs } from 'pinia';

export default defineComponent({
    name: 'PlayResult',
    
    setup() {
        const gameStore = useGameStore()
        const { getPlayResult } = storeToRefs(gameStore)
        const showMechanics = ref(false)

        const playResult = computed(() => getPlayResult.value)

        const formatTime = (seconds) => {
            const minutes = Math.floor(seconds / 60)
            const remainingSeconds = seconds % 60
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
        }

        const toggleMechanics = () => {
            showMechanics.value = !showMechanics.value
        }

        const refreshResult = async () => {
            await gameStore.fetchPlayResult()
        }

        onMounted(() => {
            // Optionally fetch result on component mount
            // refreshResult()
        })

        return {
            playResult,
            showMechanics,
            formatTime,
            toggleMechanics,
            refreshResult
        }
    }
})
</script>

<style scoped>
.play-result {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0;
    background-color: #f9f9f9;
}

.play-result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.play-result-header h3 {
    margin: 0;
    color: #333;
}

.result-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding: 0.5rem;
    background-color: #fff;
    border-radius: 4px;
}

.result-type {
    color: #2196F3;
}

.result-value {
    color: #4CAF50;
    font-weight: bold;
}

.play-details {
    margin: 1rem 0;
}

.play-details h4 {
    margin-bottom: 0.5rem;
    color: #333;
}

.play-details ul {
    margin: 0;
    padding-left: 1.5rem;
}

.play-details li {
    margin-bottom: 0.25rem;
}

.game-state-update {
    margin: 1rem 0;
}

.game-state-update h4 {
    margin-bottom: 0.5rem;
    color: #333;
}

.state-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 0.5rem;
    padding: 0.5rem;
    background-color: #fff;
    border-radius: 4px;
}

.state-item {
    padding: 0.25rem;
}

.mechanics {
    margin: 1rem 0;
    padding: 0.5rem;
    background-color: #fff;
    border-radius: 4px;
}

.mechanics h4 {
    margin-bottom: 0.5rem;
    color: #333;
}

.mechanic-details {
    font-family: monospace;
    font-size: 0.9rem;
}

.mechanic-item {
    padding: 0.125rem 0;
    border-bottom: 1px solid #eee;
}

.mechanic-item:last-child {
    border-bottom: none;
}

.cards-info {
    margin: 1rem 0;
    padding: 0.5rem;
    background-color: #fff;
    border-radius: 4px;
}

.cards-info h4 {
    margin-bottom: 0.5rem;
    color: #333;
}

.cards-details div {
    margin-bottom: 0.25rem;
}

.no-result {
    text-align: center;
    padding: 2rem;
    color: #666;
}
</style>
