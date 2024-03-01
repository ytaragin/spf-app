
<template>
    <div class="single-stat">
        <div class="stat-name">{{name}}: </div>
        <div class="stat-val">{{val}}</div>
    </div>
</template>

<script setup>
    defineProps({
       name:String, 
       val:[String, Number],
    })
</script>

<style>
.stat-name {
    font-weight: bold;
}
        .stat-val {
        }

.single-stat{
  display: flex;
}
</style>
