<template>
  <div>
    <h1>Available Players</h1>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(id, index) in availablePlayerIDs" v-bind:key="id">
          <td>{{ id }}</td>
          <td>{{ availablePlayerNames[index] }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useDefenseStore } from '@/stores/teamStore'

const defenseStore = useDefenseStore()
const { availablePlayerIDs } = storeToRefs(defenseStore)

const availablePlayerNames = computed(() => {
  return availablePlayerIDs.value.map((id) => defenseStore.getPlayerByID(id).name)
})
</script>
