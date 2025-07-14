<template>
    <div class="play-lineup">
        <StandardPlayLineup v-if="currentPlayType === 'standard'" :offenseActive="offenseActive" />
        <KickoffPlayLineup v-if="currentPlayType === 'kickoff'" :offenseActive="offenseActive" />

        <v-btn @click="submitLineup" color="success" variant="elevated">Submit Lineup</v-btn>
    </div>
</template>

<script>
import { defineComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useTeamsStore } from '../stores/teamStore'
import { useGameStore } from '../stores/gameStore'
import { SPFMetadata } from "../game/SPFMetadata.js"
import StandardPlayLineup from './StandardPlayLineup.vue'
import KickoffPlayLineup from './KickoffPlayLineup.vue'

export default defineComponent({
    name: 'PlayLineup',
    components: {
        StandardPlayLineup,
        KickoffPlayLineup
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

        const submitLineup = () => {
            console.log("Submitting Lineup")
            
            // Get the appropriate layout based on offense/defense
            const isDefense = !props.offenseActive
            const rows = spfMetadata.getBoxLayout(isDefense)
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
        }

        return {
            submitLineup
        }
    }
})
</script>


