<template>
    <div class="spot-component" 
         :class="{ 
           'spot-hovered': isHovered, 
           'spot-related': isRelated,
           'spot-highlighted': isHighlighted 
         }"
         @mouseenter="handleMouseEnter"
         @mouseleave="handleMouseLeave">
        <div class="box">{{ boxLabel }} </div>
        <PlayerSelector v-if="active" :boxName="boxName"  />
        <PlayerRecord :boxName="boxName" :inPlace="false" />
    </div>
</template>
  
<script>
import { defineComponent, computed } from 'vue';
import PlayerSelector from './PlayerSelector.vue';
import PlayerRecord from './PlayerRecord.vue';
import { useGameStore } from '../stores/gameStore.js';
import { storeToRefs } from 'pinia';


export default defineComponent({
    props: {
        boxName: String,
        active: Boolean,
    },

    setup(props) {
        const gameStore = useGameStore();
        const { hoveredBox, relatedBox } = storeToRefs(gameStore);

        const boxLabel = computed(() => gameStore.getBoxLabel(props.boxName));
        
        const isHovered = computed(() => hoveredBox.value === props.boxName);
        const isRelated = computed(() => relatedBox.value === props.boxName);
        const isHighlighted = computed(() => gameStore.isBoxHighlighted(props.boxName));

        const handleMouseEnter = () => {
            gameStore.setHoveredBox(props.boxName);
        };

        const handleMouseLeave = () => {
            gameStore.clearHover();
        };

        return { 
            boxLabel,
            isHovered,
            isRelated,
            isHighlighted,
            handleMouseEnter,
            handleMouseLeave
        }
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
    transition: all 0.2s ease-in-out;
}

.spot-component.spot-highlighted {
    border-color: #007acc;
    box-shadow: 0 0 8px rgba(0, 122, 204, 0.3);
}

.spot-component.spot-hovered {
    background-color: rgba(0, 122, 204, 0.1);
    border-color: #007acc;
    box-shadow: 0 0 12px rgba(0, 122, 204, 0.5);
}

.spot-component.spot-related {
    background-color: rgba(255, 165, 0, 0.1);
    border-color: #ffa500;
    box-shadow: 0 0 8px rgba(255, 165, 0, 0.4);
}

.box {
    text-underline-position: below;
    text-decoration-line: underline;
    text-align: center;
}
</style>
  
