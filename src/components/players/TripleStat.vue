
        
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

    const props = defineProps({
       title: String,
       stats: Array,
       labels: Array,
    });

function getValue(input) {
  // If the input is a string, return it
  if (typeof input === 'string') {
    return input;
  }
  // If the input is an object with a 'Val' property, return the value of 'Val'
else if (typeof input === 'object' && input !== null && 'Val' in input && input.Val !== undefined) {
//else if (typeof input === 'object' && input !== null && 'Val' in input) {
    return input.Val;
  }
  // If the input is undefined, or doesn't match the above conditions, return "-"
  else {
    return '-';
  }
}

    const formatStat = (stat) => {
        if (stat == "Sg") {
        return stat;
        }
        if (stat.Val == 0) {
        return stat;
        }
        return stat?.Val || '-';
    }

    const formatStats = (labels, stats) => {
    // function formatStats(stats) {
    console.log(stats);
       return labels
    //.map(label =>formatStat(stats[label])) 
    .map(label =>getValue(stats[label])) 
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
