<template>
<v-img
    src="field1.png"
    alt="Football field"
    :height="fieldHeight"
    :width="fieldWidth"
    position="relative"
  >
  <v-img
      src="ball4.png"
      alt="Overlay image"
      :style="{
        position: 'absolute',
        top: `${ball_top}px`, // Adjust positioning as needed
        left: `${ball_left}px`, // Adjust positioning as needed
        width: `${ball_width}px`, // Adjust dimensions as needed
        height: `${ball_height}px`, // Adjust dimensions as needed
          border: '1px solid #000',
      }"
    />
  </v-img>
</template>


<script setup>
const props = defineProps({
  ballPosition: {
    type: Number,
    default: 60, // Set default value
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
const edge_buffer = Math.floor(.10*props.fieldWidth);
console.log(`edge_buffer: ${edge_buffer}`);
const ball_width = props.fieldWidth/8;
const ball_height = props.fieldHeight/4;
const ball_top = props.fieldHeight/2 - ball_height/2;
const actual_width= (props.fieldWidth-(2*edge_buffer));
console.log(`actual_width: ${actual_width}`);
const ball_left = edge_buffer + actual_width * props.ballPosition / 100;
console.log(`ball_left: ${ball_left}`);

</script>

<style>
.v-img__image {
  /* Adjust styling as needed */
}
</style>
