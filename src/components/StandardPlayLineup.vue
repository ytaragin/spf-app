<template>
    <div class="standard-play-lineup">
        <TeamLineup v-if="!offenseActive" :active="offenseActive" title="Offensive Lineup" :isDefense="!trueval" />
        <TeamLineup :active="!offenseActive" title="Defensive Lineup" :isDefense="trueval" />
        <TeamLineup v-if="offenseActive" :active="offenseActive" title="Offensive Lineup" :isDefense="!trueval" />
    </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import TeamLineup from './TeamLineup.vue'

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
        const trueval = ref(true);
        
        return {
            trueval
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
