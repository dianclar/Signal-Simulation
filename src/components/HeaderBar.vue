<script setup>
import { ElMessage } from 'element-plus'
import {
  wallcolor1,
  wallcolor2,
  wallcolor3,
  wallcolor4,
} from '../assets/config'

const emit = defineEmits(['upload-room', 'save'])

// 生成报告（占位功能：当前版本仅提示，报告生成待后续实现）
const testnow = () => {
  ElMessage.info('报告生成功能开发中')
}

// 图纸上传：解析 JSON 房型数据，将结果交回父组件重建画布
const uploadroom = () => {
  let roomdata = null
  try {
    roomdata = JSON.parse(prompt('json:'))
  } catch (e) {
    ElMessage.error('图纸 JSON 解析失败，请检查输入格式')
    return
  }
  if (!roomdata) return
  console.log(roomdata)
  const walldata = []
  try {
    const wall1 = roomdata['墙体分类']['承重墙'].map(i =>
      i['坐标'].map(j => j / 1),
    )
    walldata.push({ wall: wall1, col: wallcolor1 })
  } catch (e) {
    console.log(1, e)
  }
  try {
    const wall2 = roomdata['墙体分类']['普通墙'].map(i =>
      i['坐标'].map(j => j / 1),
    )
    walldata.push({ wall: wall2, col: wallcolor2 })
  } catch (e) {
    console.log(2, e)
  }
  try {
    const wallDecor = roomdata['墙体分类']['吊顶/装饰线'].map(i =>
      i['坐标'].map(j => j / 1),
    )
    walldata.push({ wall: wallDecor, col: wallcolor2 })
  } catch (e) {
    console.log(3, e)
  }
  try {
    const doorWall = roomdata['门窗位置']['门'].map(i =>
      i['坐标'].map(j => j / 1),
    )
    walldata.push({ wall: doorWall, col: wallcolor3 })
  } catch (e) {
    console.log(4, e)
  }
  try {
    const windowWall = roomdata['门窗位置']['窗'].map(i =>
      i['坐标'].map(j => j / 1),
    )
    walldata.push({ wall: windowWall, col: wallcolor4 })
  } catch (e) {
    console.log(5, e)
  }
  let polypos = []
  try {
    polypos = roomdata['外围顶点'].map(i => ({
      x: i[0] / 1,
      y: i[1] / 1,
    }))
  } catch (e) {
    console.log(6, e)
  }
  console.log(walldata)
  emit('upload-room', { walldata, polypos })
}
</script>

<template>
  <header class="header">
    <div class="logo">
      <img
        src="/icon.png"
        alt="Logo"
        style="height: 39px; width: 39px"
      />
      <span>WiFi热力图仿真系统</span>
    </div>
    <div class="mode-switch">
      <el-button type="primary">交互绘制模式</el-button>
      <el-button @click="uploadroom">图纸上传</el-button>
    </div>
    <div class="action-buttons">
      <el-button
        type="primary"
        @click="emit('save')"
      >
        保存设计
      </el-button>
      <el-button
        type="success"
        @click="testnow"
      >
        生成报告
      </el-button>
    </div>
  </header>
</template>
