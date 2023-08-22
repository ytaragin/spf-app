<template>
  <h1>{{ title }}</h1>
  <button v-if="active" @click="submitLineup">Submit Lineup</button>
  <h3>-{{ gameMsg }}</h3>
  <div class="team-lineup">

    <PlayerRow v-for="row in rowList" :active="active" :boxes="row" />
  </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue'
import PlayerRow from './PlayerRow.vue'
import { SPFMetadata } from "../game/SPFMetadata.js"
import { useTeamsStore } from '../stores/teamStore';
import { storeToRefs } from 'pinia';
import { useGameStore } from '../stores/gameStore';

export default defineComponent({
  components: {
    PlayerRow,
  },

  props: {
    active: Boolean,
    title: String,
    isDefense: Boolean,
  },

  setup(props) {

    let spfMetadata = new SPFMetadata();

    const rows = spfMetadata.getBoxLayout(props.isDefense);
    const { playerPositions } = storeToRefs(useTeamsStore());
    const gameStore = useGameStore();
    const { gameMsg } = storeToRefs(gameStore);



    // const fetchTeam = () => {
    //   console.log("fetchTeam Pressed");
    //   defenseStore.fetchPlayers();
    //   console.log("fetchTeam Was Pressed");

    // }

    // const fetchAPlayer = () => {
    //   console.log("fetchAPlayer Pressed");
    //   let res = defenseStore.getPlayerByID("DL-36");
    //   console.log(`res is ${res.name}`);

    // }

    const submitLineup = () => {
      console.log("Submitting Lineup")
      let spots = rows.flat();

      let obj = spots.reduce((accumulator, current) => {
        let p = playerPositions.value[current];
        let md = spfMetadata.getPositionMetaData(current);
        let id = p ? p.id : null;
        if (md.allowMultiple) {
          if (id) {
            id = [id];
          }
          else {
            id = [];
          }

        }
        accumulator[current] = id; // assign the key-value pair
        return accumulator; // return the updated object
      }, {});

      gameStore.setLineup(obj, props.isDefense);


    }

    const rowList = computed(() => {
      let a = rows;
      if (!props.active) {
        a = rows.slice().map(inner => inner.slice().reverse());
        a.reverse();
      }
      return a;
    })




    // Other setup logic

    // Return anything needed for the component
    return { rowList, rows, submitLineup, playerPositions, gameMsg };
  },

})
</script>

<style>
.team-lineup {
  display: flex;
  flex-direction: column;
}
</style>
