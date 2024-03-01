


<template>
    <div class="statbox">
        <div class="stattitle">{{title}}</div>
        <div>
            <div v-for="label in labels" >
                {{ label.value || label.key }} {{ stats[label.key] }}
            </div>
        </div>
    </div>
</template>


<script setup>
    import { ref } from 'vue'

    const props = defineProps({
  stats: Object,
  labels: Array,
       title: String,
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
