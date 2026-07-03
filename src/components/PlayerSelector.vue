<template>
  <!-- <h4> Player Selector ( {{ boxName }})</h4> -->
  <div class="player-selector">
    <div class="player-name">
      <v-select
        v-model="selectedPlayerId"
        :items="availablePlayersForPos"
        variant="outlined"
        density="compact"
        item-title="name"
        item-value="id"
      ></v-select>
    </div>
    <div class="player-buttons">
      <v-btn :disabled="selectedPlayerId == ''" @click="selectPlayer"> Set </v-btn>
      <v-btn @click="clearPlayer">Clear</v-btn>
    </div>
  </div>
</template>

<script setup>
// v-if='playerName!= "-"'
import { computed, ref } from 'vue'
import { useTeamsStore } from '@/stores/teamStore' // Adjust the path as needed

const props = defineProps({
  boxName: String,
  active: Boolean
})

const teamStore = useTeamsStore()

const selectedPlayerId = ref('')

const availablePlayersForPos = computed(() => {
  return teamStore.getPlayersForBox(props.boxName).map((id) => {
    return { id, name: getPlayerRecord(id).name }
  })
})

const selectPlayer = () => {
  if (selectedPlayerId.value) {
    teamStore.selectPlayer(selectedPlayerId.value, props.boxName)
  }
}

const clearPlayer = () => {
  teamStore.removePlayer(props.boxName)
  // Reset the selection in the v-select UI
  selectedPlayerId.value = ''
}

const getPlayerRecord = (id) => {
  let r = teamStore.getPlayerByIDBothTeams(id)
  if (!r) {
    return { name: '-' }
  }
  return r
}
</script>

<style>
.player-selector {
  display: flex;
  flex-direction: column;
}
.player-name {
  width: 100%;
}
</style>

<!--        <select v-model="selectedPlayerId">
            <option value="" disabled>Select a player</option>
            <option v-for="id in availablePlayersForPos" :key="id" :value="id">
                {{ getPlayerRecord(id).name }}
            </option>
        </select>
<template>
    <div class="player-selector">
        <h4>Player Selector</h4>
        <select v-model="selectedPlayerId">
            <option value="" disabled>Select a player</option>
            <option v-for="player in availablePlayers.value.values()" :key="player.id" :value="player.id">
                {{ player.name }}
            </option>
        </select>
        <v-btn @click="selectPlayer">Select</button>
    </div>

    v-if="Object.keys(playerMap).length > 0"
</template> -->

<!-- <table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Position</th>
        </tr>
    </thead>
    <tbody>
        <tr v-for="(playerRecord, playerId) in playerMap" :key="playerId">
            <td>{{ playerRecord.name }}</td>
            <td>{{ playerRecord.id }}</td>
        </tr>
    </tbody>
</table> -->
