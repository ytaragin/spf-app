<template>
<v-img
    src="field1.png"
    alt="Football field"
    :height="fieldHeight"
    :width="fieldWidth"
    position="relative"
  >
  <!-- Current ball position line (line of scrimmage) -->
  <div
      :style="{
        position: 'absolute',
        top: '0px',
        left: `${ball_left}px`,
        width: '3px',
        height: `${fieldHeight}px`,
        backgroundColor: 'lightblue',
        zIndex: 1,
      }"
      alt="Line of scrimmage"
    />
  <!-- First down target line -->
  <div
      v-if="firstDownTarget !== null"
      :style="{
        position: 'absolute',
        top: '0px',
        left: `${first_down_left}px`,
        width: '3px',
        height: `${fieldHeight}px`,
        backgroundColor: 'yellow',
        zIndex: 1,
      }"
      alt="First down target line"
    />
  <!-- Ball -->
  <v-img
      src="ball4.png"
      alt="Overlay image"
      :style="{
        position: 'absolute',
        top: `${ball_top}px`, // Adjust positioning as needed
        left: `${ball_left_offset}px`, // Positioned behind the line of scrimmage
        width: `${ball_width}px`, // Adjust dimensions as needed
        height: `${ball_height}px`, // Adjust dimensions as needed
          border: '1px solid #000',
          zIndex: 2,
      }"
    />
  </v-img>
</template>


<script setup>
import { computed } from 'vue'

const props = defineProps({
  ballPosition: {
    type: Number,
    default: 60, // Set default value
  },
  firstDownTarget: {
    type: Number,
    default: null, // Set default value to null (no first down line)
  },
  fieldWidth: {
    type: Number,
    default: 600, // Set default value
  },
  fieldHeight: {
    type: Number,
    default: 300, // Set default value
  },
});

const edge_buffer = computed(() => Math.floor(.10*props.fieldWidth));
const ball_width = computed(() => props.fieldWidth/16); // Made smaller (was /8)
const ball_height = computed(() => props.fieldHeight/8); // Made smaller (was /4)
const ball_top = computed(() => props.fieldHeight/2 - ball_height.value/2);
const actual_width = computed(() => (props.fieldWidth-(2*edge_buffer.value)));

// Function to calculate x position based on yard line (0-100)
const calculateXPosition = (yardLine) => {
  return edge_buffer.value + actual_width.value * yardLine / 100;
};

const ball_left = computed(() => calculateXPosition(props.ballPosition));
// Position ball behind the line of scrimmage (towards the offense's own goal)
const ball_left_offset = computed(() => ball_left.value - ball_width.value); // 5px gap from line

// First down line positioning
const first_down_left = computed(() => {
  if (props.firstDownTarget === null) return null;
  return calculateXPosition(props.firstDownTarget);
});

console.log(`edge_buffer: ${edge_buffer.value}`);
console.log(`actual_width: ${actual_width.value}`);
console.log(`ball_left: ${ball_left.value}`);
console.log(`first_down_target: ${props.firstDownTarget}`);
console.log(`first_down_left: ${first_down_left.value}`);

</script>

<style>
/* Football field styling */
</style>
