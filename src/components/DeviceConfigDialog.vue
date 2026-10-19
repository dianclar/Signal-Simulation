<script setup>
import { inject } from 'vue'
import { ElMessage } from 'element-plus'

// 画布实例（由 App.vue 注入，ref 引用）
const canvas = inject('canvas')

// 弹窗显隐（绑定 App.vue 的 popshow）
const show = defineModel('show', { type: Boolean, default: false })
// 当前编辑的设备对象（绑定 App.vue 的 popval）
const device = defineModel('device', { type: Object, default: null })

const props = defineProps({
  divarr: { type: Array, default: () => [] },
})

const emit = defineEmits(['save'])

// 确定：将编辑后的半径/信号强度应用到对应设备
const popok = () => {
  if (!device.value || !device.value.div) {
    ElMessage.warning('请先选择要配置的设备')
    return
  }
  const size = Number(device.value.size)
  const hesize = Number(device.value.hesize)
  const safeSize = isFinite(size) && size > 0 ? size : 180
  const safeHesize = isFinite(hesize) && hesize > 0 ? hesize : 20
  device.value.size = safeSize
  device.value.hesize = safeHesize
  let matched = false
  props.divarr.forEach(item => {
    if (item.div.id == device.value.div.id) {
      matched = true
      item.size = safeSize
      item.hesize = safeHesize
      item.Group.set({
        scaleX: safeSize / 180,
        scaleY: safeSize / 180,
      })
      item.Heat.set({
        scaleX: safeHesize / 20,
        scaleY: safeHesize / 20,
      })
    }
  })
  if (!matched) {
    ElMessage.warning('未找到对应设备，配置未生效')
    return
  }
  canvas.value.renderAll()
  emit('save')
  show.value = false
}
</script>

<template>
  <el-dialog
    title="AP设备配置"
    v-model="show"
  >
    <template v-if="device">
      <h3>覆盖半径</h3>
      <el-input
        v-model.number="device.size"
        type="number"
      ></el-input>
      <h3>信号强度</h3>
      <el-input
        v-model.number="device.hesize"
        type="number"
      ></el-input>

      <p style="justify-content: end; display: flex">
        <el-button
          @click="popok"
          type="primary"
          >确定</el-button
        >
      </p>
    </template>
  </el-dialog>
</template>
