<template>
    <div class="play-lineup">
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
            <component :is="getPlaySelector()" :active="true" />
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
        currentPlayType: {
            type: String,
            required: true
        },
        offenseActive: {
            type: Boolean,
            required: true
        }
    },
    setup(props) {
        const { playerPositions } = storeToRefs(useTeamsStore())
        const gameStore = useGameStore()
        const spfMetadata = new SPFMetadata()
        
        // State to track if lineup has been submitted
        const lineupSubmitted = ref(false)

        // Get layout rows based on play type
        const playLayout = computed(() => {
            return spfMetadata.getBoxLayoutForPlay(props.currentPlayType)
        })

        const offenseRows = computed(() => {
            return playLayout.value.offense
        })

        const defenseRows = computed(() => {
            return playLayout.value.defense
        })

        // Function to get the appropriate play selector component
        const getPlaySelector = () => {
            // For kickoff plays, show KickoffPlaySelector only when offense is active
            if (props.currentPlayType === 'kickoff') {
                return props.offenseActive ? KickoffPlaySelector : null
            }
            
            // Return the appropriate selector based on which side is active
            return props.offenseActive ? OffensePlaySelector : DefensePlaySelector
        }


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


