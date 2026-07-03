<template>
  <div class="player-row">
    <SpotComponent v-for="box in boxes" :key="box" :boxName="box" :active="active"> </SpotComponent>
  </div>
</template>

<script setup>
import SpotComponent from './SpotComponent.vue'

defineProps({
  boxes: { type: Array, required: true },
  active: Boolean
})
</script>

<style>
.player-row {
  display: flex;
}
</style>
