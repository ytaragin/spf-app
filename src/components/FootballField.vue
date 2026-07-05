<template>
  <!-- Responsive field: fills its container width and keeps a 2:1 aspect ratio.
       All overlays are positioned as percentages so they scale with the field
       at any size (no fixed pixels / JS measurement needed). -->
  <div class="football-field" :style="fieldStyle">
    <!-- Line of scrimmage (current ball position) -->
    <div
      class="field-line line-scrimmage"
      :style="{ left: `${ballLeftPct}%` }"
      aria-label="Line of scrimmage"
    />
    <!-- First down target line -->
    <div
      v-if="firstDownTarget !== null"
      class="field-line line-first-down"
      :style="{ left: `${firstDownLeftPct}%` }"
      aria-label="First down target line"
    />
    <!-- Ball, sitting just behind the line of scrimmage -->
    <img
      src="/ball4.png"
      alt="Ball"
      class="field-ball"
      :style="ballStyle"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  ballPosition: {
    type: Number,
    default: 60 // yard line, 0-100
  },
  firstDownTarget: {
    type: Number,
    default: null // null = no first down line
  },
  // Optional cap on the rendered width. `null` lets the field fill its
  // container (recommended). Accepts a number (px) or any CSS length string.
  maxWidth: {
    type: [Number, String],
    default: null
  }
})

// Percentage of the field width kept clear at each edge (behind the end zones).
const EDGE_BUFFER_PCT = 10
const PLAYABLE_PCT = 100 - 2 * EDGE_BUFFER_PCT

// Ball is sized relative to the field so it scales at any width.
const BALL_WIDTH_PCT = 100 / 16 // ~6.25% of field width

// Map a yard line (0-100) to a horizontal percentage across the field.
const yardToPct = (yardLine) => EDGE_BUFFER_PCT + (PLAYABLE_PCT * yardLine) / 100

const ballLeftPct = computed(() => yardToPct(props.ballPosition))

const firstDownLeftPct = computed(() =>
  props.firstDownTarget === null ? null : yardToPct(props.firstDownTarget)
)

const fieldStyle = computed(() => {
  if (props.maxWidth === null) return {}
  const mw = typeof props.maxWidth === 'number' ? `${props.maxWidth}px` : props.maxWidth
  return { maxWidth: mw }
})

// Sit the ball just behind (to the left of) the line of scrimmage.
const ballStyle = computed(() => ({
  width: `${BALL_WIDTH_PCT}%`,
  left: `${ballLeftPct.value - BALL_WIDTH_PCT}%`
}))
</script>

<style scoped>
.football-field {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 1;
  margin: 0 auto;
  background-image: url('/field1.png');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  border-radius: 4px;
  overflow: hidden;
}

.field-line {
  position: absolute;
  top: 0;
  height: 100%;
  width: 3px;
  transform: translateX(-50%);
  z-index: 1;
}

.line-scrimmage {
  background-color: lightblue;
}

.line-first-down {
  background-color: yellow;
}

.field-ball {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  height: auto;
  border: 1px solid #000;
  z-index: 2;
}
</style>
