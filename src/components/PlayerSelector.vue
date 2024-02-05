<template>
    <!-- <h4> Player Selector ( {{ boxName }})</h4> -->
    <div class="player-selector">
        <select v-model="selectedPlayerId">
            <option value="" disabled>Select a player</option>
            <option v-for="id in availablePlayersForPos" :key="id" :value="id">
                {{ getPlayerRecord(id).name }}
            </option>
        </select>
        <button :disabled='selectedPlayerId == ""' @click="selectPlayer" > Set </button>
        <button  @click="clearPlayer" >Clear</button>

    </div>
</template>

<script>
    // v-if='playerName!= "-"'
import { defineComponent, computed, ref, onMounted } from 'vue'
//   import { useStore } from 'pinia';
import { useTeamsStore } from '@/stores/teamStore' // Adjust the path as needed
import { storeToRefs } from 'pinia';

export default defineComponent({
    props: {
        boxName: String,
        active: Boolean,
    },



    setup(props) {
        const teamStore = useTeamsStore()
        const { availablePlayerIDs, getPlayersForBox, version, updateVersion } = storeToRefs(teamStore);
        // console.log(`Selector Avail Players: ${availablePlayerIDs}`)
        // console.log(availablePlayerIDs)


        const selectedPlayerId = ref("");

        const updateCounter = () => {
            teamStore.updateVersion();
        }

        const versionCounter = computed(() => teamStore.version)

        const availablePlayersForPos = computed(() => {
            // console.log(`Trying to get players for ${props.boxName}`)
            return teamStore.getPlayersForBox(props.boxName)

        })


        const playerName = computed(() => {
            const player = getPlayerRecord(props.boxName);
            if (player) {
                return player.name
            }
            return "-"
        })

        const selectPlayer = () => {
            if (selectedPlayerId.value) {
                // console.log(`${selectedPlayerId.value} was selected`)
                teamStore.selectPlayer(selectedPlayerId.value, props.boxName)

                // const selectedPlayer = availablePlayers.value[selectedPlayerId.value]
                // defenseStore.selectPlayer(props.rowIndex, props.spotIndex, selectedPlayer.value)
            }

            console.log(playerName.value);
        }

        const clearPlayer = () => {
            console.log(`Trying to remove ${props.boxName}`);
            teamStore.removePlayer(props.boxName);
        }

        const getPlayerRecord = (id) => {
            // console.log(`Getting record for ${id}`)
            let r = teamStore.getPlayerByIDBothTeams(id)
            if (!r) {
                return { name: "-" }
            }
            return r;
        }

        return {
            availablePlayerIDs,
            selectPlayer,
            selectedPlayerId,
            getPlayerRecord,
            availablePlayersForPos,
            clearPlayer,
            playerName,
            teamStore,
            getPlayersForBox,
            versionCounter, updateCounter
        };
    },

})
</script>

<style>
.player-selector {
    display: flex;
    align-items: center;
}
</style>


<!-- <template>
    <div class="player-selector">
        <h4>Player Selector</h4>
        <select v-model="selectedPlayerId">
            <option value="" disabled>Select a player</option>
            <option v-for="player in availablePlayers.value.values()" :key="player.id" :value="player.id">
                {{ player.name }}
            </option>
        </select>
        <button @click="selectPlayer">Select</button>
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
