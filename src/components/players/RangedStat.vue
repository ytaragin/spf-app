<template>
  <div class="statbox">
    <div class="stattitle">{{ title }}</div>
    <v-table density="compact" class="stat-table">
      <tbody>
        <tr v-for="label in labels" :key="label.key">
          <td class="outcome-col">{{ label.value || label.key }}</td>
          <td>{{ rangeFor(label.key) }}</td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<script setup>
const props = defineProps({
  stats: Object,
  labels: Array,
  title: String
})

const rangeFor = (key) => {
  const v = props.stats?.[key]
  return v === undefined || v === null || v === '' ? '-' : v
}
</script>

<style scoped>
.stattitle {
  font-weight: bold;
}

.statbox {
  display: flex;
  flex-direction: column;
}

.stat-table {
  font-variant-numeric: tabular-nums;
}

.outcome-col {
  font-weight: 700;
  white-space: nowrap;
}
</style>
