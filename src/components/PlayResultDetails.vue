<template>
  <div class="play-result-details">
    <div class="summary-grid">
      <div><strong>Result Type:</strong> {{ play.result.result_type }}</div>
      <div><strong>Result:</strong> {{ play.result.result }} yards</div>
      <div v-if="play.result.time"><strong>Play Time:</strong> {{ play.result.time }}s</div>
      <div><strong>Quarter:</strong> {{ play.new_state.quarter }}</div>
      <div><strong>Clock:</strong> {{ formattedTime }}</div>
      <div><strong>Score:</strong> H {{ play.new_state.home_score }} - {{ play.new_state.away_score }} A</div>
      <div><strong>Possession:</strong> {{ play.new_state.possession }}</div>
      <div><strong>Down:</strong> {{ play.new_state.down }}</div>
      <div><strong>Yard Line:</strong> {{ play.new_state.yard_line }}</div>
      <div><strong>First Down Target:</strong> {{ play.new_state.first_down_target }}</div>
      <div><strong>Status:</strong> {{ play.new_state.last_status }}</div>
    </div>

    <div v-if="play.result.details && play.result.details.length" class="details-block">
      <h5>Details</h5>
      <ul>
        <li v-for="d in play.result.details" :key="d">{{ d }}</li>
      </ul>
    </div>

    <div v-if="play.result.mechanic && play.result.mechanic.length" class="mechanics-block">
      <h5>Mechanics</h5>
      <pre class="mechanics-pre" v-for="m in play.result.mechanic" :key="m">{{ m }}</pre>
    </div>

    <div v-if="play.result.cards" class="cards-block">
      <h5>Cards</h5>
      <div><strong>Flipped:</strong> {{ play.result.cards.cards_flipped.join(', ') }}</div>
      <div><strong>Had Z:</strong> {{ play.result.cards.had_z ? 'Yes' : 'No' }}</div>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'
export default defineComponent({
  name: 'PlayResultDetails',
  props: {
    play: { type: Object, required: true }
  },
  setup(props){
    const formattedTime = computed(() => {
      const t = props.play.new_state.time_remaining
      if (typeof t === 'number') {
        const m = Math.floor(t/60)
        const s = (t % 60).toString().padStart(2,'0')
        return `${m}:${s}`
      }
      return t
    })
    return { formattedTime }
  }
})
</script>

<style scoped>
.play-result-details {
  background: #fafafa;
  border-radius: 4px;
  margin-top: .25rem;
  font-size: .85rem;
  line-height: 1.3;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit,minmax(170px,1fr));
  gap: .4rem .75rem;
  padding: .5rem .25rem .75rem;
}
.details-block, .mechanics-block, .cards-block { 
  margin: .5rem 0 0; 
  padding: .5rem .5rem .25rem; 
  background: #fff; 
  border: 1px solid #eee; 
  border-radius: 4px; 
}
.details-block h5, .mechanics-block h5, .cards-block h5 { 
  margin: 0 0 .35rem; 
  font-size: .75rem; 
  text-transform: uppercase; 
  letter-spacing: .05em; 
  color: #555; 
}
.mechanics-pre { 
  background: #272822; 
  color: #f8f8f2; 
  padding: .35rem .5rem; 
  margin: 0 0 .35rem; 
  font-size: .7rem; 
  border-radius: 3px; 
  overflow-x: auto;
}
.mechanics-pre:last-child { margin-bottom: 0; }
ul { 
  margin: 0; 
  padding-left: 1.1rem; 
}
ul li { margin-bottom: .2rem; }
ul li:last-child { margin-bottom: 0; }
</style>
