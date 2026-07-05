<template>
  <PlayerStatCard title="KR" subtitle="Kick Return Unit">
    <!-- Returner Names List -->
    <div class="returners-list">
      <div v-for="(returner, index) in processedReturners" :key="index" class="returner-row">
        <span class="returner-label">KR-{{ index + 1 }}:</span>
        <span class="returner-name">{{ returner.displayName }}</span>
      </div>
    </div>

    <!-- Return Stats Table -->
    <div class="return-stats">
      <div class="stattitle">Return Stats</div>
      <table class="stats-table">
        <thead>
          <tr>
            <th>Roll</th>
            <th v-for="(returner, index) in processedReturners" :key="index">KR-{{ index + 1 }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rollIndex in maxStatsLength" :key="rollIndex">
            <td>{{ rollIndex }}</td>
            <td
              v-for="(returner, returnerIndex) in processedReturners"
              :key="returnerIndex"
              :class="getStatClass(returner, rollIndex - 1)"
            >
              {{ formatStatValue(returner, rollIndex - 1) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </PlayerStatCard>
</template>

<script setup>
import { computed } from 'vue'
import PlayerStatCard from './PlayerStatCard.vue'

const props = defineProps({
  player: {
    type: Object,
    required: true
  }
})

const processedReturners = computed(() => {
  if (!props.player.returners) return []

  const result = []
  let lastActualReturner = null

  for (const returner of props.player.returners) {
    if (returner.Actual) {
      lastActualReturner = returner.Actual
      result.push({
        ...returner.Actual,
        displayName: returner.Actual.name
      })
    } else if (returner.SameAs && lastActualReturner) {
      result.push({
        ...lastActualReturner,
        displayName: `Same as ${returner.SameAs}`
      })
    }
  }

  return result
})

const maxStatsLength = computed(() => {
  if (processedReturners.value.length === 0) return 0
  return Math.max(
    ...processedReturners.value.map((returner) => returner.return_stats?.stats?.length || 0)
  )
})

const formatStatValue = (returner, statIndex) => {
  // If this returner is a "Same As" reference, just show "-"
  if (returner.displayName && returner.displayName.startsWith('Same as')) {
    return '-'
  }

  const stat = returner.return_stats?.stats?.[statIndex]
  if (!stat) return '-'

  let value = stat.yards.toString()
  if (stat.asterisk) value += '*'
  if (stat.fumble) value += 'f'

  return value
}

const getStatClass = (returner, statIndex) => {
  const stat = returner.return_stats?.stats?.[statIndex]
  if (!stat) return ''

  const classes = []
  if (stat.asterisk) classes.push('asterisk-cell')
  if (stat.fumble) classes.push('fumble-cell')

  return classes.join(' ')
}
</script>

<style scoped>
.returners-list {
  margin-bottom: 24px;
}

.returner-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 8px;
  background-color: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 4px;
}

.returner-label {
  font-weight: bold;
  color: rgb(var(--v-theme-primary));
  margin-right: 8px;
  min-width: 50px;
}

.returner-name {
  color: rgba(var(--v-theme-on-surface), 0.87);
}

.return-stats {
  margin-top: 16px;
}

.stattitle {
  font-weight: bold;
  margin-bottom: 12px;
  color: rgba(var(--v-theme-on-surface), 0.87);
  font-size: 1.1em;
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
}

.stats-table th,
.stats-table td {
  padding: 8px 12px;
  text-align: center;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.stats-table th {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
  font-weight: bold;
  color: rgba(var(--v-theme-on-surface), 0.87);
}

.stats-table td {
  background-color: rgb(var(--v-theme-surface));
}

.asterisk-cell {
  background-color: rgba(var(--v-theme-warning), 0.2);
}

.fumble-cell {
  background-color: rgba(var(--v-theme-error), 0.2);
}

.asterisk-cell.fumble-cell {
  background-color: rgba(var(--v-theme-error), 0.3);
}
</style>
