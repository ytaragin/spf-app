<template>
  <!--
    Shared frame for all players/* position cards. Provides a consistent
    title, padding, density, width, and theme-aware colors so each position
    card no longer hand-rolls its own <v-card> boilerplate. The stat markup
    itself is passed via the default slot (unchanged for now; a follow-up
    standardizes it on v-table/v-chip).
  -->
  <v-card class="player-stat-card" density="compact" variant="elevated">
    <v-card-title v-if="title" class="player-stat-card-title text-subtitle-2">
      {{ title }}
    </v-card-title>
    <v-card-subtitle v-if="subtitle" class="player-stat-card-subtitle">
      {{ subtitle }}
    </v-card-subtitle>
    <v-card-text class="player-stat-card-body">
      <slot />
    </v-card-text>
  </v-card>
</template>

<script setup>
defineProps({
  title: String,
  subtitle: String
})
</script>

<style scoped>
/* Constrain width so the card stays readable inside the narrow PlayerRecord
   hover menu while still being able to grow for wider cards (QB/K/KR). */
.player-stat-card {
  min-width: 220px;
  max-width: 360px;
}

.player-stat-card-title {
  font-weight: 700;
  padding-bottom: 4px;
}

.player-stat-card-subtitle {
  padding-top: 0;
}

.player-stat-card-body {
  padding-top: 8px;
}
</style>
