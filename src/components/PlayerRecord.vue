<template>
  <div class="player-record">
    <h1>{{ boxName }}</h1>
    <!-- Display other player information here -->
    {{ playerName }}
  </div>
</template>

<script>
import { computed, defineComponent } from 'vue'
import { useTeamsStore } from '../stores/teamStore';
import { storeToRefs } from 'pinia';
import { useGameStore } from '../stores/gameStore';

export default defineComponent({
  props: {
    boxName: String,
    active: Boolean,
  },
  setup(props) {
    const teamStore = useTeamsStore();
    const { playerPositions } = storeToRefs(teamStore);
    const gamesStore = useGameStore();
    const { getPlayer } = storeToRefs(gamesStore);



    function getPlayerRecord(boxName) {
      let rec = null;
      let id = gamesStore.getPlayer(boxName);
      if (id) {
        // console.log(`Returned id: ${id}`)
        rec = teamStore.getPlayerByIDBothTeams(id)
        // console.log(rec)
      }
      if (!rec) {
        rec = playerPositions.value[boxName];
      }
      return rec;
    }

    const playerName = computed(() => {
      // const player = playerPositions.value[props.boxName];
      const player = getPlayerRecord(props.boxName);
      if (player) {
        return player.name
      }
      return "-"
    })

    return { playerPositions, playerName }

  }

})
</script>

<style>
.player-record {
  border: 1px solid #ccc;
  padding: 10px;
  margin: 5px;
}
</style>
