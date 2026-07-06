<template>
  <div class="statbox">
    <div class="stattitle">{{ title }}</div>
    <v-table density="compact" class="stat-table">
      <thead>
        <tr>
          <th class="roll-col"></th>
          <th>{{ labels.join('/') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(s, index) in stats" :key="index">
          <td class="roll-col">{{ index + 1 }}:</td>
          <td>{{ formatStats(labels, s.stats) }}</td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  stats: Array,
  labels: Array
})

function getValue(input) {
  // If the input is a string, return it
  if (typeof input === 'string') {
    return input
  }
  // If the input is an object with a 'Val' property, return the value of 'Val'
  else if (
    typeof input === 'object' &&
    input !== null &&
    'Val' in input &&
    input.Val !== undefined
  ) {
    return input.Val
  }
  // If the input is undefined, or doesn't match the above conditions, return "-"
  else {
    return '-'
  }
}

const formatStats = (labels, stats) => {
  return labels.map((label) => getValue(stats[label])).join('/')
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

.roll-col {
  width: 1%;
  white-space: nowrap;
  font-weight: 700;
}
</style>
