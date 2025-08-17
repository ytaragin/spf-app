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
                <button class="play-summary" @click="toggle(index)" :aria-expanded="isExpanded(index)" :aria-controls="'play-details-' + index">
                    <div class="indicator">
                        <span class="chevron" :class="{ open: isExpanded(index) }">▸</span>
                        <span class="play-number">Play {{ index + 1 }}</span>
                    </div>
                    <div class="play-details">
                        <span class="possession">{{ play.new_state.possession }}</span>
                        <span class="yard-line">Yard {{ play.new_state.yard_line }}</span>
                        <span class="result">{{ formatPlayResult(play.result) }}</span>
                    </div>
                </button>
                <transition name="collapse">
                    <div v-if="isExpanded(index)" :id="'play-details-' + index" class="play-expanded">
                        <PlayResultDetails :play="play" />
                    </div>
                </transition>
            </div>
        </div>
    </div>
</template>

<script>
import { defineComponent, computed, ref } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { storeToRefs } from 'pinia'
import PlayResultDetails from './PlayResultDetails.vue'

export default defineComponent({
    name: 'PlayHistory',
    components: { PlayResultDetails },
    
    setup() {
        const gameStore = useGameStore()
        const { getAllPlayResults } = storeToRefs(gameStore)
        
        const playResults = computed(() => getAllPlayResults.value)
        const expanded = ref(new Set())
        
        const formatPlayResult = (result) => {
            if (result.result_type === 'TurnOver') {
                return `Turnover - ${result.result} yards`
            }
            // Add more result type formatting as needed
            return `${result.result_type} - ${result.result} yards`
        }
        const toggle = (index) => {
            if (expanded.value.has(index)) {
                expanded.value.delete(index)
            } else {
                expanded.value.add(index)
            }
            // force ref reactivity for Set mutation
            expanded.value = new Set(expanded.value)
        }
        const isExpanded = (index) => expanded.value.has(index)
        
        return {
            playResults,
            formatPlayResult,
            toggle,
            isExpanded
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
    background-color: white;
    border-radius: 4px;
    border-left: 4px solid #1976d2; 
}

.play-summary {
    all: unset;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem;
    width: 100%;
}

.play-summary:focus-visible {
    outline: 2px solid #1976d2;
    outline-offset: 2px;
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

.indicator { 
    display: flex; 
    align-items: center; 
    gap: .25rem;
}

.chevron { 
    transition: transform .2s ease; 
    display: inline-block; 
    font-size: .8rem;
}
.chevron.open { 
    transform: rotate(90deg); 
}

.play-expanded { 
    padding: .5rem 1rem 1rem 1rem; 
    border-top: 1px solid #eee; 
}

/* Collapse transition */
.collapse-enter-from, .collapse-leave-to { 
    max-height: 0; 
    opacity: 0; 
    overflow: hidden; 
}
.collapse-enter-to, .collapse-leave-from { 
    max-height: 1000px; 
    opacity: 1; 
}
.collapse-enter-active, .collapse-leave-active { 
    transition: max-height .25s ease, opacity .25s ease; 
}
</style>
