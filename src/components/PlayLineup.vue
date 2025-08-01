<template>
    <div class="play-lineup">

            <div class="play-type-info">
                <strong>Current Play Type:</strong> {{ nextPlayType || 'Not set' }}
            </div>
        <!-- Team Lineup Section - Show when lineup hasn't been submitted -->
            <TeamLineup v-if="!offenseActive" 
                :active="offenseActive" 
                title="Offensive Lineup" 
                :rows="offenseRows" />
            <TeamLineup 
                :active="!offenseActive" 
                title="Defensive Lineup" 
                :rows="defenseRows" />
            <TeamLineup v-if="offenseActive" 
                :active="offenseActive" 
                title="Offensive Lineup" 
                :rows="offenseRows" />

            <v-btn @click="submitLineup" color="success" variant="elevated">Submit Lineup</v-btn>

        <!-- Play Selector Section - Show after lineup is submitted -->
        <div v-if="lineupSubmitted" class="play-selector-section">
            <h3>Select Play</h3>
            <component v-if="getPlaySelector" :is="getPlaySelector" :active="true" />
            <div v-else>Loading play selector...</div>
        </div>

    </div>
</template>

<script>
import { defineComponent, computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useTeamsStore } from '../stores/teamStore'
import { useGameStore } from '../stores/gameStore'
import { SPFMetadata } from "../game/SPFMetadata.js"
import TeamLineup from './TeamLineup.vue'
import OffensePlaySelector from './PlaySelectors/OffensePlaySelector.vue'
import DefensePlaySelector from './PlaySelectors/DefensePlaySelector.vue'
import KickoffPlaySelector from './PlaySelectors/KickoffPlaySelector.vue'

export default defineComponent({
    name: 'PlayLineup',
    components: {
        TeamLineup
    },
    props: {
        offenseActive: {
            type: Boolean,
            required: true
        }
    },
    setup(props) {
        const { playerPositions } = storeToRefs(useTeamsStore())
        const gameStore = useGameStore()
        const { getNextPlayType } = storeToRefs(gameStore)
        const spfMetadata = new SPFMetadata()
        
        // State to track if lineup has been submitted
        const lineupSubmitted = ref(false)

        // Get current play type from game store
        // const currentPlayType = computed(() => getNextPlayType.value)
        const nextPlayType = computed(() => getNextPlayType.value);

        // Get layout rows based on play type
        const playLayout = computed(() => {
            console.log("Getting Play Layout for type:", nextPlayType.value)
            if (!nextPlayType.value) {
                console.log("No play type available yet, returning empty layout")
                return { offense: [], defense: [] }
            }
            return spfMetadata.getBoxLayoutForPlay(nextPlayType.value)
        })

        const offenseRows = computed(() => {
            return playLayout.value.offense
        })

        const defenseRows = computed(() => {
            return playLayout.value.defense
        })

        // Computed property to get the appropriate play selector component
        const getPlaySelector = computed(() => {
            // Return null if no play type is available yet
            if (!nextPlayType.value) {
                return null
            }
            
            // For kickoff plays, show KickoffPlaySelector only when offense is active
            if (nextPlayType.value === 'Kickoff') {
                console.log("Returning KickoffPlaySelector for kickoff play")
                return props.offenseActive ? KickoffPlaySelector : null
            }
            console.log(`Returning ${props.offenseActive ? 'OffensePlaySelector' : 'DefensePlaySelector'} for play type: ${nextPlayType.value}`)
            // Return the appropriate selector based on which side is active
            return props.offenseActive ? OffensePlaySelector : DefensePlaySelector
        })


        const submitLineup = () => {
            console.log("Submitting Lineup")

            // Get the appropriate layout based on offense/defense and play type
            const isDefense = !props.offenseActive
            const rows = isDefense ? playLayout.value.defense : playLayout.value.offense
            const spots = rows.flat()

            const obj = spots.reduce((accumulator, current) => {
                const p = playerPositions.value[current]
                const md = spfMetadata.getPositionMetaData(current)
                let id = p ? p.id : null
                
                if (md.allowMultiple) {
                    if (id) {
                        id = [id]
                    } else {
                        id = []
                    }
                }
                
                accumulator[current] = id
                return accumulator
            }, {})

            gameStore.setLineup(obj, isDefense)
            
            // Mark lineup as submitted to proceed to next step
            lineupSubmitted.value = true
        }


        return {
            offenseRows,
            defenseRows,
            getPlaySelector,
            lineupSubmitted,
            nextPlayType,
            submitLineup,
        }
    }
})
</script>

<style scoped>
.play-lineup {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.play-selector-section {
    padding: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background-color: #f9f9f9;
}

.completion-section {
    padding: 1rem;
    border: 1px solid #4caf50;
    border-radius: 8px;
    background-color: #e8f5e8;
    text-align: center;
}

.completion-section h3 {
    color: #2e7d32;
    margin-bottom: 0.5rem;
}
</style>


