<template>
    <div class="spot-component">
        <div class="box">{{ boxLabel }} </div>
        <PlayerSelector v-if="active" :boxName="boxName"  />
        <PlayerRecord :boxName="boxName" :active="active"/>
    </div>
</template>
  
<script>
import { defineComponent, computed } from 'vue';
import PlayerSelector from './PlayerSelector.vue';
import PlayerRecord from './PlayerRecord.vue';
import { SPFMetadata } from "../game/SPFMetadata.js"


export default defineComponent({
    props: {
        boxName: String,
        active: Boolean,
    },

    setup(props) {

        let spfMetadata = new SPFMetadata();

        const boxLabel = computed(() => spfMetadata.getBoxLabel(props.boxName));

        return { boxLabel }
    },

    components: {
        // DefenseSpot
        PlayerSelector,
        PlayerRecord
    }
});
</script>
  
<style>
.spot-component {
    border: 1px solid #ccc;
    padding: 10px;
    margin: 5px;
}

.box {
    text-underline-position: below;
    text-decoration-line: underline;
    text-align: center;

}
</style>
  
