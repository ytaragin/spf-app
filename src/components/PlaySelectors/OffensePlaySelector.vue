<template>
    <div class="offense-play-selector">
        <v-select v-model="selectedPlay" :items="plays" label="Choose Play" density="compact">
        </v-select>

        <v-select v-model="targetBox" :items="boxes" label="Target Box" density="compact">
        </v-select>
        <!-- <select v-model="targetBox"> -->
        <!--     <option v-for="box in boxes" :key="box">{{ box }}</option> -->
        <!-- </select> -->

        <v-btn @click="submitPlay">Submit Play</v-btn>

    </div>
</template>

<script>
import { defineComponent, ref, watch, computed } from 'vue'
import { SPFMetadata } from "@/game/SPFMetadata.js"
import { useGameStore } from '@/stores/gameStore'
import { storeToRefs } from 'pinia';


export default defineComponent({
    props: {
        active: Boolean
    },
    setup(props) {

        const gamesStore = useGameStore()
        const getPlayer = gamesStore.getPlayer
        const getHardCodedValue = gamesStore.getHardCodedValue;
        console.log(`Number is ${getHardCodedValue()}`)
        // console.log(gamesStore)
        // const { getPlayer } = storeToRefs(gamesStore);
        console.log(gamesStore.getPlayer)
        console.log(getPlayer)
        console.log(`In b1 ${gamesStore.getPlayer("b1")}`)

        let spfMetadata = new SPFMetadata();
        let plays = spfMetadata.getOffensivePlayNames();

        const boxes = ref([])
        const selectedPlay = ref(null);
        const targetBox = ref(null);

        watch(selectedPlay, newValue => {
            console.log(`selected Play ${newValue}`)

            console.log(`In b1 ${gamesStore.getPlayer("b1")}`)
            boxes.value = spfMetadata.getBoxesPerPlay(newValue).filter((box) => getPlayer(box))
            // boxes.value = spfMetadata.getBoxesPerPlay(newValue).filter((box) => box == "b1")
            console.log(`boxes now ${boxes.value}`)
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
            getHardCodedValue,
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
