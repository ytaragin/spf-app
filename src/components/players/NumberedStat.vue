<template>
  <div class="statbox">
    <div  class="stattitle">{{ title }}</div>
    <div v-for="(val, index) in formattedValues" :key="index">{{ index + 1 }}: {{ val }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  values: Array,
  title: String,
});

const formattedValues = computed(() => {
  const result = [];

  // Add values from the prop array
  for (const val of props.values) {
    const formattedVal = typeof val === 'object' ? val.Val : val;
    result.push(formattedVal);
  }


  return result;
});
</script>
