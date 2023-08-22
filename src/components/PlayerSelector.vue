<template>
    <!-- <h4> Player Selector ( {{ boxName }})</h4> -->
    <div class="player-selector">
        <select v-model="selectedPlayerId">
            <option value="" disabled>Select a player</option>
            <option v-for="id in availablePlayersForPos" :key="id" :value="id">
                {{ getPlayerRecord(id).name }}
            </option>
        </select>
        <button v-if='selectedPlayerId != ""' @click="selectPlayer" :disabled="!active"> Set </button>
        <button v-if='selectedPlayerId != ""' @click="clearPlayer" :disabled="!active">Clear</button>

    </div>
</template>

<script>
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

        // console.log(Object.keys(playerMap).length)
        // const fetchPlayers = playerStore.fetchPlayers;

        // const availNames = computed(() => {
        //     let s = availablePlayerIDs.value.length;
        //     console.log(`Avail Players length is ${s}`)
        //     availablePlayerIDs.value.map((id) => defenseStore.getPlayerByID(id).name)
        // });

        // const availablePlayerNames = computed(() => {
        //     return availablePlayerIDs.value.map(id => defenseStore.getPlayerByID(id).name)
        // })
        const updateCounter = () => {
            teamStore.updateVersion();
        }

        const versionCounter = computed(() => teamStore.version)

        const availablePlayersForPos = computed(() => {
            // console.log(`Trying to get players for ${props.boxName}`)
            return teamStore.getPlayersForBox(props.boxName)

        })

        const selectPlayer = () => {
            if (selectedPlayerId.value) {
                // console.log(`${selectedPlayerId.value} was selected`)
                teamStore.selectPlayer(selectedPlayerId.value, props.boxName)

                // const selectedPlayer = availablePlayers.value[selectedPlayerId.value]
                // defenseStore.selectPlayer(props.rowIndex, props.spotIndex, selectedPlayer.value)
            }
        }

        const clearPlayer = () => {
            teamStore.removePlayer(props.boxName);
        }

        const getPlayerRecord = (id) => {
            // console.log(`Getting record for ${id}`)
            let r = teamStore.getPlayerByIDBothTeams(id)
            if (!r) {
                return { name: "Kevin" }
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
            teamStore,
            getPlayersForBox,
            versionCounter, updateCounter
        };
    },

    // setup(props) {
    //     const defenseStore = useDefenseStore()
    //     const selectedPlayerId = ref('')

    //     const availablePlayers = computed(() => defenseStore.getAvailablePlayers())
    //     console.log(availablePlayers.value);

    //     const selectPlayer = () => {
    //         if (selectedPlayerId.value) {
    //             console.log(`${selectedPlayerId.value} was selected`)
    //             // const selectedPlayer = availablePlayers.value[selectedPlayerId.value]
    //             // defenseStore.selectPlayer(props.rowIndex, props.spotIndex, selectedPlayer.value)
    //         }
    //     }

    //     onMounted(() => {
    //         defenseStore.fetchPlayers()
    //     })

    //     return {
    //         selectedPlayerId,
    //         availablePlayers,
    //         selectPlayer
    //     }
    // }
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
