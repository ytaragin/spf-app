<!-- A vue component that makes a call to the server and based on the response it instantiates one of three other components -->
<template>
  <div>
    <h2>Select a Play Type</h2>
    <ul>
      <li v-for="(playType, index) in playTypes" :key="index" @click="selectPlayType(playType)">
        {{ playType.name }}
      </li>
    </ul>
  </div>
</template>

<script>
import { fetchPlayTypes, playTypes } from '../stores/gameStore';

export default {
  name: 'PlayTypeManager',
  data() {
    return {
      playTypes,
    };
  },
  methods: {
    selectPlayType(playType) {
      console.log('Selected Play Type:', playType);
      // Handle the selected play type here
    },
  },
  created() {
    fetchPlayTypes();
  },
};
</script>

<style scoped>
ul {
  list-style-type: none;
  padding: 0;
}

li {
  cursor: pointer;
  padding: 10px;
  border: 1px solid #ccc;
  margin: 5px 0;
}

li:hover {
  background-color: #f0f0f0;
}
</style> 