<template>
  <v-sheet elevation="12" rounded="lg" width="100%" class="pa-4 text-center mx-auto">
    <!-- <div class="player-record" @mouseenter="handleMouseenter" @mouseleave="handleMouseleave"> -->
    <div class="player-record">
      <template v-if="!inPlace">
        <v-menu open-on-hover location="end">
          <template v-slot:activator="{ props }">
            <!-- <div @mouseover="props.open">Hover me</div> -->
            <PlayerName v-bind="props" :name="playerName" :team="playerTeam" />
            {{ recpos }}
          </template>
          <component :is="recpos" :player="playerRec"></component>
        </v-menu>
      </template>
      <template v-else>
        <PlayerName v-bind="props" :name="playerName" :team="playerTeam" />
        {{ recpos }}
        <component :is="recpos" :player="playerRec"></component>
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

const teamStore = useTeamsStore()
const { playerPositions } = storeToRefs(teamStore)
const gamesStore = useGameStore()

const recpos = ref('Plain')
const playerName = ref('-')
const playerTeam = ref({ name: '-', year: '-' })
const emptyPlayer = { position: 'Plain', name: '-', team: { name: '-', year: '-' } }

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

const playerPosition = computed(() => {
  const player = getPlayerRecord(props.boxName)
  if (player) {
    return player.pos
  }
  return 'Plain'
})
</script>

<style>
.player-record {
  border: 1px solid #ccc;
  padding: 10px;
  margin: 5px;
}
</style>
