<template>
    <div class="kickoff-play-lineup">
        <h2>Kickoff Play</h2>
        <div class="kickoff-container">
            <SpotComponent boxName="K" :active="offenseActive"> </SpotComponent>
            <SpotComponent boxName="KR" :active="!offenseActive"> </SpotComponent>


        </div>
    </div>
</template>

<script>
import { defineComponent } from 'vue';
// import PlayerSelector from './PlayerSelector.vue';
// import PlayerRecord from './PlayerRecord.vue';

import SpotComponent from './SpotComponent.vue';

export default defineComponent({
    name: 'KickoffPlayLineup',
    components: {
        SpotComponent
    },
    props: {
        offenseActive: {
            type: Boolean,
            required: true
        }
    },
    setup() {
        return {};
    }
});
</script>

<style scoped>
.kickoff-play-lineup {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 1rem 0;
}

.kickoff-container {
    display: flex;
    justify-content: space-around;
    gap: 2rem;
}

.kickoff-player {
    border: 1px solid #ccc;
    padding: 1rem;
    border-radius: 8px;
    flex: 1;
}

.player-spot {
    border: 1px solid #ccc;
    padding: 10px;
    margin: 5px;
}

.box {
    text-underline-position: below;
    text-decoration-line: underline;
    text-align: center;
    font-weight: bold;
    margin-bottom: 5px;
}
</style>
