<template>
  <v-chip class="single-stat" size="small" variant="tonal" label>
    <span class="stat-name">{{ name }}</span>
    <span class="stat-val">{{ val }}</span>
  </v-chip>
</template>

<script setup>
defineProps({
  name: String,
  val: [String, Number]
})
</script>

<style scoped>
.single-stat {
  margin: 2px;
}
.stat-name {
  font-weight: 700;
  margin-right: 4px;
}
.stat-val {
  font-variant-numeric: tabular-nums;
}
</style>
