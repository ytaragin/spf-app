<template>
  <h1>{{ title }}</h1>
  <h3>-{{ gameMsg }}</h3>
  <div class="team-lineup">
    <PlayerRow class="team-row" v-for="(row, index) in rowList" :key="index" :active="active" :boxes="row" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import PlayerRow from './PlayerRow.vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '../stores/gameStore'

const props = defineProps({
  active: Boolean,
  title: String,
  rows: {
    type: Array,
    required: true
  }
})

const { gameMsg } = storeToRefs(useGameStore)

const rowList = computed(() => {
  let a = props.rows
  if (!props.active) {
    a = props.rows.slice().map((inner) => inner.slice().reverse())
    a.reverse()
  }
  return a
})
</script>

<style>
.team-lineup {
  display: flex;
  flex-direction: column;
}

.team-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
</style>
