<template>
    <v-sheet
        elevation="12"
        rounded="lg"
        width="100%"
        class="pa-4 text-center mx-auto"
        >
        <!-- <div class="player-record" @mouseenter="handleMouseenter" @mouseleave="handleMouseleave"> -->
        <div class="player-record" >
    <template v-if="!inPlace">
            <v-menu open-on-hover location="end">
                <template v-slot:activator="{ props }">
                    <!-- <div @mouseover="props.open">Hover me</div> -->
                    <PlayerName v-bind="props"  :name="playerName" :team="playerTeam" />
                {{recpos}}
                </template>
                    <component :is='recpos' :player=playerRec></component>
            </v-menu>
    </template>
    <template v-else>
                    <PlayerName v-bind="props"  :name="playerName" :team="playerTeam" />
                {{recpos}}
                    <component :is='recpos' :player=playerRec></component>
    </template>
        </div>
    </v-sheet>
</template>

<script>
    import { computed, defineComponent, ref, watch } from 'vue'
    import { useTeamsStore } from '../stores/teamStore';
    import { storeToRefs } from 'pinia';
    import { useGameStore } from '../stores/gameStore';


    import RB from './players/RB.vue'
    import QB from './players/QB.vue'
    import TE from './players/TE.vue'
    import WR from './players/WR.vue'
    import OL from './players/OL.vue'
    import K from './players/K.vue'
    import LB from './players/LB.vue'
    import DL from './players/DL.vue'
    import DB from './players/DB.vue'
    import KR from './players/KR.vue'
    import Plain from './players/Plain.vue'
    import PlayerName from './players/PlayerName.vue'

    export default defineComponent({
        components: {
            QB,
            RB,
            TE, WR, OL, K,
            LB, DL, DB, KR,
            PlayerName, 
            Plain
        },
        props: {
            boxName: String,
            inPlace: Boolean,
        },
        setup(props) {
            const teamStore = useTeamsStore();
            const { playerPositions } = storeToRefs(teamStore);
            const gamesStore = useGameStore();
            const { getPlayer } = storeToRefs(gamesStore);

            const showChild = ref(false);

            const recpos = ref('Plain');
            const playerName= ref('-');
            const playerTeam = ref({name:"-", year:"-"});

            const currentView = computed(() => {
                let rec =  getPlayerRecord(props.boxName);
                console.log(`Positions is ${rec.position}`);
                console.log(rec);
                return rec.position;
            })

            function handleMouseenter() {
                showChild.value = true;
            }

            function handleMouseleave() {
                showChild.value = false;
            }


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

            watch(playerRec, (rec) => {
                console.log(`x is ${rec}`)
                if (rec) {
                    recpos.value = rec.position;
                    playerName.value = rec.name;
                    playerTeam.value = rec.team;
                    console.log(playerTeam);
                }

            })

            const playerPosition = computed(() => {
                const player = getPlayerRecord(props.boxName);
                if (player) {
                    console.log(`Position is ${player.pos} `);
                    return player.pos
                }
                return "Plain"
            })

            return { recpos, playerPosition, playerName, currentView, 
                playerRec, playerTeam, showChild, handleMouseenter, handleMouseleave,
            inPlace: props.inPlace}

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
