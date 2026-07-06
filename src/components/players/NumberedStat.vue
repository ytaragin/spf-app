<template>
  <div class="statbox">
    <div class="stattitle">{{ title }}</div>
    <v-table density="compact" class="stat-table">
      <tbody>
        <tr v-for="(val, index) in formattedValues" :key="index">
          <td class="roll-col">{{ index + 1 }}:</td>
          <td>{{ val }}</td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  values: Array,
  title: String
})

const formattedValues = computed(() => {
  const result = []

  // Add values from the prop array
  for (const val of props.values) {
    const formattedVal = typeof val === 'object' ? val.Val : val
    result.push(formattedVal)
  }

  return result
})
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

.roll-col {
  width: 1%;
  white-space: nowrap;
  font-weight: 700;
}
</style>
