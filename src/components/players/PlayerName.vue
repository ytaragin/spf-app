<template>
    <div>
        <div class="team-name">{{team.name}} ({{team.year}})</div>
        <div class="player-name">{{name}}</div>
    </div>
</template>

<script setup>
    defineProps({
       name:String, 
       team: Object,
    })
</script>

<style>
.player-name {
    font-weight: bold;
}
        .team-name {
            font-style: italic;
        }

</style>
