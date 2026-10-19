<script setup>
defineProps({
  scale: { type: Number, default: 1 },
  xCoord: { type: Number, default: 0 },
  yCoord: { type: Number, default: 0 },
  zoom: { type: Number, default: 1 },
  proportion: { type: [Number, String], default: 0 },
})
</script>

<template>
  <footer class="footer">
    <div class="status">
      <span>就绪 - 选择工具或开始绘制</span>
    </div>
    <div class="scale-info">比例尺: 1像素 = {{ scale }}米</div>
    <div class="coordinates">
      X: {{ xCoord * zoom }}, Y: {{ yCoord * zoom }}, 占比{{ proportion }}%
    </div>
  </footer>
</template>
