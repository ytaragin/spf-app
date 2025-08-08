<template>
    <div class="play-history">
        <h3>Play History</h3>
        <div v-if="playResults.length === 0" class="no-plays">
            No plays yet
        </div>
        <div v-else class="play-list">
            <div 
                v-for="(play, index) in playResults" 
                :key="index"
                class="play-item"
            >
                <div class="play-number">Play {{ index + 1 }}</div>
                <div class="play-details">
                    <span class="possession">{{ play.new_state.possession }}</span>
                    <span class="yard-line">Yard {{ play.new_state.yard_line }}</span>
                    <span class="result">{{ formatPlayResult(play.result) }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { storeToRefs } from 'pinia'

export default defineComponent({
    name: 'PlayHistory',
    
    setup() {
        const gameStore = useGameStore()
        const { getAllPlayResults } = storeToRefs(gameStore)
        
        const playResults = computed(() => getAllPlayResults.value)
        
        const formatPlayResult = (result) => {
            if (result.result_type === 'TurnOver') {
                return `Turnover - ${result.result} yards`
            }
            // Add more result type formatting as needed
            return `${result.result_type} - ${result.result} yards`
        }
        
        return {
            playResults,
            formatPlayResult
        }
    }
})
</script>

<style scoped>
.play-history {
    margin: 1rem 0;
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: #f9f9f9;
}

.play-history h3 {
    margin: 0 0 1rem 0;
    color: #333;
    font-size: 1.2em;
}

.no-plays {
    color: #666;
    font-style: italic;
    text-align: center;
    padding: 1rem;
}

.play-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.play-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem;
    background-color: white;
    border-radius: 4px;
    border-left: 4px solid #1976d2;
}

.play-number {
    font-weight: bold;
    color: #1976d2;
    min-width: 60px;
}

.play-details {
    display: flex;
    gap: 1rem;
    flex: 1;
}

.possession {
    font-weight: 600;
    color: #333;
    min-width: 60px;
}

.yard-line {
    color: #666;
    min-width: 80px;
}

.result {
    color: #2e7d32;
    font-weight: 500;
}
</style>
