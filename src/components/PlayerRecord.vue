<template>
  <v-sheet elevation="12" rounded="lg" width="100%" class="pa-4 text-center mx-auto">
    <!-- <div class="player-record" @mouseenter="handleMouseenter" @mouseleave="handleMouseleave"> -->
    <div class="player-record">
      <template v-if="!inPlace">
        <v-menu open-on-hover location="end">
          <template v-slot:activator="{ props }">
            <!-- Bind the menu activator props onto a real DOM element (span)
                 rather than the PlayerName component. Newer Vuetify 3.x needs
                 the activator listeners/ref on an element; forwarding them
                 through a plain component silently breaks the hover. -->
            <span v-bind="props" class="player-record-activator">
              <PlayerName :name="playerName" :team="playerTeam" />
              {{ recpos }}
            </span>
          </template>
          <component :is="recposComponent" :player="playerRec"></component>
        </v-menu>
      </template>
      <template v-else>
        <PlayerName :name="playerName" :team="playerTeam" />
        {{ recpos }}
        <component :is="recposComponent" :player="playerRec"></component>
      </template>
    </div>
  </v-sheet>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useTeamsStore } from '../stores/teamStore'
import { storeToRefs } from 'pinia'
import { useGameStore } from '../stores/gameStore'

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

const props = defineProps({
  boxName: String,
  inPlace: Boolean
})

// Map position strings to their component objects. `<component :is="...">`
// must receive an actual component (not a bare string), otherwise Vue tries
// to resolve the string as a globally-registered component. Since these are
// imported locally in <script setup>, a string like 'RB' resolves to nothing
// and the hover menu renders empty. Resolving to the object fixes that.
const positionComponents = { RB, QB, TE, WR, OL, K, LB, DL, DB, KR, Plain }

const teamStore = useTeamsStore()
const { playerPositions } = storeToRefs(teamStore)
const gamesStore = useGameStore()

const recpos = ref('Plain')
const playerName = ref('-')
const playerTeam = ref({ name: '-', year: '-' })
const emptyPlayer = { position: 'Plain', name: '-', team: { name: '-', year: '-' } }

// Resolve the position string to its component object for `<component :is>`.
const recposComponent = computed(() => positionComponents[recpos.value] || Plain)

function getPlayerRecord(boxName) {
  let rec = null
  // Prefer locally selected playerPositions first so Clear reflects immediately
  rec = playerPositions.value[boxName]
  if (!rec) {
    const id = gamesStore.getPlayer(boxName)
    if (id) {
      rec = teamStore.getPlayerByIDBothTeams(id)
    }
  }
  if (!rec) {
    return emptyPlayer
  }
  return rec
}

const playerRec = computed(() => {
  return getPlayerRecord(props.boxName)
})

watch(
  playerRec,
  (rec) => {
    // Always update, even when cleared; fall back to shared emptyPlayer object
    const r = rec || emptyPlayer
    recpos.value = r.position
    playerName.value = r.name
    playerTeam.value = r.team
  },
  { immediate: true }
)
</script>

<style>
.player-record {
  border: 1px solid #ccc;
  padding: 10px;
  margin: 5px;
}

.player-record-activator {
  display: inline-block;
  cursor: help;
}
</style>
