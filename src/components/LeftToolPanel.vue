<script setup>
import { inject } from 'vue'

// 画布实例（由 App.vue 注入，ref 引用）
const canvas = inject('canvas')

// 与 App.vue 双向绑定的共享状态
const nowstatus = defineModel('nowstatus', { type: Number, default: 0 })
const roomup = defineModel('roomup', { type: Boolean, default: false })
const selectedMaterial = defineModel('selectedMaterial', {
  type: String,
  default: '混凝土',
})
const doord = defineModel('doord', { type: Boolean, default: false })
const doorr = defineModel('doorr', { type: Number, default: 0 })

const emit = defineEmits([
  'delete-selected',
  'auto-add',
  'undo',
  'recover',
  'clear',
])

// 切换绘制/选择模式
const toggleDrawMode = () => {
  nowstatus.value = 0
  if (canvas.value && canvas.value.isDrawingMode) {
    canvas.value.isDrawingMode = false
  } else {
    canvas.value.isDrawingMode = true
  }
}
// 绘制墙面/窗户
const toggleWall = () => {
  nowstatus.value = nowstatus.value == 3 ? 0 : 3
}
// 绘制房型
const toggleRoom = () => {
  // 仅切换绘制状态，是否重新开始绘制由 App.vue 根据当前房型顶点数决策（watch nowstatus）
  nowstatus.value = nowstatus.value == 4 ? 0 : 4
}
// 绘制房门
const toggleDoor = () => {
  nowstatus.value = nowstatus.value == 5 ? 0 : 5
}
// 添加光猫：先退出绘制模式，避免拖拽选择与放置冲突
const setAddMode = val => {
  if (canvas.value) canvas.value.isDrawingMode = false
  nowstatus.value = val
}
</script>

<template>
  <aside class="left-panel">
    <h3>绘制工具</h3>
    <div class="tool-group">
      <div
        class="tool-item"
        @click="toggleDrawMode"
      >
        <span>{{ canvas && canvas.isDrawingMode ? '选择元素' : '取消' }}</span>
      </div>
    </div>
    <div class="tool-group">
      <div
        :class="{ 'tool-item': true, active: nowstatus == 3 }"
        @click="toggleWall"
      >
        <span>绘制墙面/窗户</span>
      </div>
    </div>
    <div class="tool-group">
      <div
        :class="{ 'tool-item': true, active: nowstatus == 4 }"
        @click="toggleRoom"
      >
        <span>绘制房型</span>
      </div>
    </div>
    <div class="tool-group">
      <div
        :class="{ 'tool-item': true, active: nowstatus == 5 }"
        @click="toggleDoor"
      >
        <span>绘制房门</span>
      </div>
    </div>
    <div
      class="tool-group"
      style="background-color: rgba(255, 0, 0, 0.1)"
    >
      <div
        class="tool-item"
        @click="emit('delete-selected')"
      >
        <span style="color: red">删除选中元素</span>
      </div>
    </div>

    <h3>墙体材质</h3>
    <div class="material-tabs">
      <el-radio-group v-model="selectedMaterial">
        <el-radio-button label="混凝土" />
        <el-radio-button label="砖墙" />
        <el-radio-button label="木板" />
        <el-radio-button label="玻璃" />
      </el-radio-group>
    </div>

    <h3>房门选项</h3>
    <div class="material-tabs">
      <div
        style="
          display: flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 10px;
        "
      >
        旋转角度:
        <el-input
          style="flex: 1"
          v-model.number="doorr"
        />
      </div>
      <el-radio-group v-model="doord">
        <el-radio-button
          label="顺时针"
          :value="false"
        />
        <el-radio-button
          label="逆时针"
          :value="true"
        />
      </el-radio-group>
    </div>

    <h3>AP设备</h3>
    <div
      class="tool-item"
      @click="setAddMode(1)"
    >
      <span>添加主光猫</span>
    </div>
    <div
      class="tool-item"
      @click="setAddMode(2)"
    >
      <span>添加从光猫</span>
    </div>
    <div
      class="tool-item"
      @click="emit('auto-add')"
    >
      <span>自动添加光猫</span>
    </div>

    <h3>操作</h3>
    <div
      class="tool-item"
      @click="emit('undo')"
    >
      <span>撤销</span>
    </div>
    <div
      class="tool-item"
      @click="emit('recover')"
    >
      <span>恢复</span>
    </div>
    <div
      class="tool-item"
      @click="emit('clear')"
    >
      <span>清空</span>
    </div>
  </aside>
</template>
