<template>
    <div class="standard-play-lineup">
        <TeamLineup v-if="!offenseActive" :active="offenseActive" title="Offensive Lineup" :isDefense="false" :rows="offenseRows" />
        <TeamLineup :active="!offenseActive" title="Defensive Lineup" :isDefense="true" :rows="defenseRows" :playSelector="!offenseActive ? DefensePlaySelector : null" />
        <TeamLineup v-if="offenseActive" :active="offenseActive" title="Offensive Lineup" :isDefense="false" :rows="offenseRows" :playSelector="offenseActive ? OffensePlaySelector : null" />
    </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import TeamLineup from './TeamLineup.vue'
import OffensePlaySelector from './PlaySelectors/OffensePlaySelector.vue'
import DefensePlaySelector from './PlaySelectors/DefensePlaySelector.vue'
import { SPFMetadata } from "../game/SPFMetadata.js"

export default defineComponent({
    name: 'StandardPlayLineup',
    components: {
        TeamLineup
    },
    props: {
        offenseActive: {
            type: Boolean,
            required: true
        }
    },
    setup() {
        const spfMetadata = new SPFMetadata();
        const offenseRows = spfMetadata.getBoxLayout(false);
        const defenseRows = spfMetadata.getBoxLayout(true);
        
        return {
            OffensePlaySelector,
            DefensePlaySelector,
            offenseRows,
            defenseRows
        };
    }
});
</script>

<style scoped>
.standard-play-lineup {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}
</style>
