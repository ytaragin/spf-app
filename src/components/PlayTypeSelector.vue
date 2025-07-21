<template>
    <div class="play-selector">
        <h3>Play Type</h3>
        <div class="play-options">
            <button 
                v-for="playType in playTypes" 
                :key="playType.value"
                :class="{ 'active': selectedPlayType === playType.value }"
                @click="selectPlayType(playType.value)">
                {{ playType.label }}
            </button>
        </div>
    </div>
</template>

<script>
import { defineComponent, ref, onMounted, computed, watch } from 'vue';
import { useGameStore } from '../stores/gameStore';

export default defineComponent({
    name: 'PlaySelector',
    emits: ['update:playType'],
    props: {
        playType: {
            type: String,
            default: 'standard'
        }
    },
    setup(props, { emit }) {
        const gameStore = useGameStore();
        
        const selectedPlayType = ref(props.playType);

        // Computed property to map server play types to the format expected by the component
        const playTypes = computed(() => {
            const storePlayTypes = gameStore.getPlayTypes;
            
            // If no play types from store, fall back to defaults
            if (!storePlayTypes || storePlayTypes.length === 0) {
                return [
                    { label: 'Standard Play', value: 'standard' },
                    { label: 'Kickoff', value: 'kickoff' }
                ];
            }
            
            // Map server play types to component format
            return storePlayTypes.map(playType => {
                if (typeof playType === 'string') {
                    return { label: playType, value: playType };
                }
                return {
                    label: playType.name || playType.label || playType,
                    value: playType.value || playType.name || playType
                };
            });
        });

        const selectPlayType = (playType) => {
            selectedPlayType.value = playType;
            emit('update:playType', playType);
        };

        // Watch for changes in playTypes and auto-select if only one option
        const updateSelectedPlayType = () => {
            const availablePlayTypes = playTypes.value;
            if (availablePlayTypes.length === 1) {
                const singlePlayType = availablePlayTypes[0].value;
                if (selectedPlayType.value !== singlePlayType) {
                    selectedPlayType.value = singlePlayType;
                    emit('update:playType', singlePlayType);
                }
            }
        };

        // Fetch play types when component mounts
        onMounted(() => {
            gameStore.fetchPlayTypes();
            // Check if we need to auto-select after initial fetch
            updateSelectedPlayType();
        });

        // Watch for changes in playTypes and update selection accordingly
        watch(playTypes, () => {
            updateSelectedPlayType();
        });

        return {
            playTypes,
            selectedPlayType,
            selectPlayType
        };
    }
});
</script>

<style scoped>
.play-selector {
    margin: 1rem 0;
    padding: 0.5rem;
    border: 1px solid #eee;
    border-radius: 4px;
}

.play-options {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.play-options button {
    padding: 0.5rem 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: #f8f8f8;
    cursor: pointer;
}

.play-options button.active {
    background-color: #4CAF50;
    color: white;
    border-color: #388E3C;
}
</style>
