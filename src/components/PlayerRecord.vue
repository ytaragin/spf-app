<template>
    <v-sheet
        elevation="12"
        rounded="lg"
        width="100%"
        class="pa-4 text-center mx-auto"
        >
        <div class="player-record">
            <!-- Display other player information here -->
        {{ playerName }}
        <component :is='recpos' :player=playerRec></component>
        </div>
    </v-sheet>
</template>

<script>
    import { computed, defineComponent, ref } from 'vue'
    import { useTeamsStore } from '../stores/teamStore';
    import { storeToRefs } from 'pinia';
    import { useGameStore } from '../stores/gameStore';


    import QB from './players/QB.vue'
    import Plain from './players/Plain.vue'

    export default defineComponent({
        components: {
            QB,
            Plain
        },
        props: {
            boxName: String,
            active: Boolean,
        },
        setup(props) {
            const teamStore = useTeamsStore();
            const { playerPositions } = storeToRefs(teamStore);
            const gamesStore = useGameStore();
            const { getPlayer } = storeToRefs(gamesStore);

            const recpos = ref('Plain');

            const currentView = computed(() => {
                let rec =  getPlayerRecord(props.boxName);
                console.log(`Positions is ${rec.position}`);
                console.log(rec);
                return rec.position;
                //if (this.currentType === 'A') {
                 //   return 'Plain'
                //} else {
               //     return 'TypeBComponent' 
               // }
            })

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
            
            const playerRec = computed(() => {
                return getPlayerRecord(props.boxName);
            })

            const playerName = computed(() => {
                // const player = playerPositions.value[props.boxName];
                // console.log(`box name: ${props.boxName}`)
                const player = getPlayerRecord(props.boxName);
                if (player) {
                    console.log("Player set");
                    console.log(player);
                    recpos.value = player.position;
                    return player.name
                }
                return "-"
            })

            const playerPosition = computed(() => {
                // const player = playerPositions.value[props.boxName];
                // console.log(`box name: ${props.boxName}`)
                const player = getPlayerRecord(props.boxName);
                if (player) {
                    console.log(`Position is ${player.pos} `);
                    return player.pos
                }
                return "Plain"
            })

            return { recpos, playerPosition, playerName, currentView, playerRec }

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
