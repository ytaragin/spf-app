<template>
  <div class="defense-play-selector">
    <v-select v-model="selectedPlay" :items="playOptions" item-title="title" item-value="value" label="Choose Defensive Play" density="compact">
    </v-select>

    <v-select v-model="targetBox" :items="boxes" label="Target Box" density="compact">
    </v-select>

    <v-btn @click="submitPlay">Submit Play</v-btn>
  </div>
</template>
  
<script>

import { defineComponent, ref, watch } from 'vue'
import { SPFMetadata } from "../../game/SPFMetadata.js"
import { useGameStore } from '@/stores/gameStore'


export default defineComponent({
  props: {
    active: Boolean
  },
  setup(props) {

    // const { getPlayer, setOffensivePlay } = storeToRefs(useGameStore());
    const gamesStore = useGameStore();


    let spfMetadata = new SPFMetadata();
    const plays = spfMetadata.getDefensivePlayNames();
    // Defensive play options with description for v-select
    const playOptions = plays.map(code => {
      const info = spfMetadata.getDefensePlayInfo(code);
      return {
        title: info.description || code,
        value: code
      };
    });
    const boxes = ref([])
    const selectedPlay = ref(null);
    const targetBox = ref(null);

    watch(selectedPlay, (newValue) => {
      if (!newValue) {
        boxes.value = [];
        return;
      }
      const playInfo = spfMetadata.getDefensePlayInfo(newValue);
      boxes.value = playInfo.boxes.filter((box) => gamesStore.getPlayer(box));
    });

    const submitPlay = () => {
      const info = spfMetadata.getDefensePlayInfo(selectedPlay.value);
      const req = {
        defense_type: info.code,
        strategy: "Straight",
        def_players: []
      };
      
      if (targetBox.value) {
        req.key = targetBox.value.toUpperCase();
      }
      console.log(`Submitting defensive play: ${JSON.stringify(req)}`);
      gamesStore.setDefensivePlay(req);
    };

    return {
      playOptions,
      boxes,
      selectedPlay,
      targetBox,
      submitPlay,
    }
  },
  components: {
  }
})


</script>
  

<style>
.defense-play-selector {
  display: flex;
}
</style>
