<template>
  <div class="offense-play-selector">
    Choose Play
    <select v-model="selectedPlay">
      <option v-for="play in plays" :key="play">{{ play }}</option>
    </select>

    <select v-model="targetBox">
      <option v-for="box in boxes" :key="box">{{ box }}</option>
    </select>

    <button @click="submitPlay">Submit Play</button>
  </div>
</template>
  
<script>
import { defineComponent, ref, watch, computed } from 'vue'
import { SPFMetadata } from "../game/SPFMetadata.js"
import { useGameStore } from '@/stores/gameStore'
import { storeToRefs } from 'pinia';


export default defineComponent({
  props: {
    active: Boolean
  },
  setup(props) {

    // const { getPlayer, setOffensivePlay } = storeToRefs(useGameStore());
    const gamesStore = useGameStore();


    let spfMetadata = new SPFMetadata();
    let plays = spfMetadata.getOffensivePlayNames();

    const boxes = ref([])
    const selectedPlay = ref(null);
    const targetBox = ref(null);

    watch(selectedPlay, newValue => {
      console.log(gamesStore.getPlayer)
      boxes.value = spfMetadata.getBoxesPerPlay(newValue).filter((box) => gamesStore.getPlayer(box))
    })

    const submitPlay = () => {
      let info = spfMetadata.getOffensePlayInfo(selectedPlay.value)
      console.log(info);
      // let p = {
      //   "play_type": selectedPlay,
      //   "strategy": "Draw",
      //   "target": "FL1"
      // };

      gamesStore.setOffensivePlay({ play_type: info.code, strategy: "Draw", target: targetBox.value.toUpperCase() });
    }

    return {
      plays,
      boxes,
      selectedPlay,
      targetBox,
      submitPlay,
      // getPlayer
    }
  },
  components: {
  }
})


</script>
  
<style>
.offense-play-selector {
  display: flex;
}
</style>
  