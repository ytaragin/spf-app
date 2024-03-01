
        
        <template>
        <div class="statbox">
            <div class="stattitle">{{title}}</div>
            <div>
  <table>
    <thead>
      <tr>
        <!-- <th v-for="label in labels" :key="label">{{ label }}</th> -->
        <th >{{labels.join('/')}}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(s, index) in stats" :key="index">
        <td>{{ index + 1 }}:</td>
        <td>
          {{ formatStats(labels, s.stats) }}
        </td>
      </tr>
    </tbody>
  </table>
  </div>
  </div>
</template>


<script setup>
    import { ref } from 'vue'

    const props = defineProps({
       title: String,
       stats: Array,
       labels: Array,
    });

    const formatStats = (labels, stats) => {
    // function formatStats(stats) {
       return labels
    .map(label => stats[label]?.Val || '-')
    .join('/')
    }

</script>

<style>
.player-name {
    font-weight: bold;
}
        .team-name {
            font-style: italic;
        }
        .stattitle {
            font-weight: bold;
            }

.statbox{
  display: flex;
  flex-direction: column;
}
</style>
