<template>
  <div class="statbox">
    <div class="stattitle">{{ title }}</div>
    <div>
      <div v-for="label in labels" :key="label.key">
        {{ label.value || label.key }}: {{ stats[label.key] }}
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  stats: Object,
  labels: Array,
  title: String
})
</script>

<style>
.player-name {
  font-weight: bold;
}
.team-name {
  font-style: italic;
}
</style>
