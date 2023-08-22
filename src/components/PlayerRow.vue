<template>
  <div class="player-row">
    <SpotComponent v-for="box in boxes" :boxName="box" :active="active"> </SpotComponent>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import SpotComponent from './SpotComponent.vue';


export default defineComponent({
  props: {
    boxes: { type: Array, required: true },
    active: Boolean
  },
  setup(props) {
    return {};
  },
  components: {
    SpotComponent
  }
})


</script>

<style>
.player-row {
  display: flex;
}
</style>
