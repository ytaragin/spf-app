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
            const emptyPlayer = { position: 'Plain', name: '-', team: { name: '-', year: '-' } };

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
                // Prefer locally selected playerPositions first so Clear reflects immediately
                rec = playerPositions.value[boxName];
                if (!rec) {
                    let id = gamesStore.getPlayer(boxName);
                    if (id) {
                        rec = teamStore.getPlayerByIDBothTeams(id);
                    }
                }
                if (!rec) {
                    return emptyPlayer;
                }
                return rec;
            }

            const playerRec = computed(() => {
                return getPlayerRecord(props.boxName);
            })

            watch(playerRec, (rec) => {
                // Always update, even when cleared; fall back to shared emptyPlayer object
                const r = rec || emptyPlayer;
                recpos.value = r.position;
                playerName.value = r.name;
                playerTeam.value = r.team;
            }, { immediate: true })

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
