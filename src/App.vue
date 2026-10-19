<script setup>
import { onMounted, ref, watch, provide } from 'vue'
import * as fabric from 'fabric'
import defaultroom from './assets/defaultroom'
import createdoor from './utils/createdoor'
import {
  createConcentricCircle,
  createHeatCircle,
  createWall,
} from './utils/fabricObjects'
import drawGrid from './utils/grid'
import getproportion from './utils/proportion'
import getState from './utils/state'
import calcCanvasPoint from './utils/coords'
import autoAddUtil from './utils/autoAdd'
import createroomUtil from './utils/room'
import LeftToolPanel from './components/LeftToolPanel.vue'
import RightToolPanel from './components/RightToolPanel.vue'
import HeaderBar from './components/HeaderBar.vue'
import FooterBar from './components/FooterBar.vue'
import DeviceConfigDialog from './components/DeviceConfigDialog.vue'
import { ElMessage } from 'element-plus'

import {
  wallcolor1,
  wallcolor2,
  wallcolor3,
  wallcolor4,
  gridSize,
} from './assets/config'

const mainRouterModel = ref('华为HS8546V5')
const subRouterModel = ref('华为K662c')
const coverageRadius = ref(180)
const scale = ref(1)
const nowstatus = ref(0)
const zoom = ref(1)

// 修改半径
const updateCoverageRadius = e => {
  const num = Number(e)
  if (!isFinite(num) || num <= 0) return
  divarr.value.forEach(d => {
    d.Group.set({
      scaleX: num / 180,
      scaleY: num / 180,
    })
    d.size = e
  })
  canvas.value.renderAll()
  save()
}

// 状态变量
const selectedMaterial = ref('混凝土')
const canvas = ref(null) // 添加对canvas实例的引用

// 向子组件注入画布引用（ref 本身，保证 .value 始终为最新实例）
provide('canvas', canvas)
const xCoord = ref(0) // 初始坐标设置为0
const yCoord = ref(0)
const doord = ref(false)
const doorr = ref(0)
const divarr = ref([]) // 存储div元素
const doorarr = ref([]) // 存储门元素

// 预览对象
let mouseCircle = null

// 绘制网格数组（线条由 utils/grid 的 drawGrid 生成并登记）
const gridarr = ref([])

// 创建div
const addDiv = ({ x, y, color, did, iid }) => {
  const newid = Date.now()
  const newDiv = document.createElement('div')
  newDiv.style.position = 'absolute'
  newDiv.style.left = `${x - 20}px` // 减去半径 20px（div 宽 40px 的一半），使点击点在圆心
  newDiv.style.top = `${y - 20}px` // 减去半径 20px（div 宽 40px 的一半），使点击点在圆心
  newDiv.style.width = '40px'
  newDiv.style.height = '40px'
  newDiv.style.borderRadius = '50%' // 圆形
  newDiv.style.background = color
  newDiv.id = did || `canvas-div-${newid}` // 给个唯一ID
  newDiv.style.cursor = 'move'
  newDiv.addEventListener('mouseover', mouon)
  newDiv.addEventListener('mousedown', moudo)
  newDiv.addEventListener('mouseout', function (event) {
    if (!newDiv.contains(event.relatedTarget)) {
      // 如果 relatedTarget 不是 newDiv 的后代，则表示鼠标真正离开了 newDiv
      mouoff(event)
    }
  })
  canvasplaceholder.value.appendChild(newDiv)
  const newicon = document.createElement('div')
  newicon.style.position = 'absolute'
  newicon.style.right = 0
  newicon.style.top = 0
  newicon.style.width = '15px'
  newicon.style.height = '15px'
  newicon.style.borderRadius = '50%' // 圆形
  newicon.style.background = '#f00'
  newicon.style.display = 'none'
  newicon.id = iid || `canvas-icon-${newid}` // 给个唯一ID
  newicon.style.cursor = 'pointer'
  newicon.addEventListener('mouseout', mouoff)
  newicon.addEventListener('mousedown', delcanel)
  newDiv.appendChild(newicon)
  return { newDiv, newicon }
}

// 创建光猫复合体
const createdivgm = e => {
  if (nowstatus.value == 1) {
    const Group = createConcentricCircle(fabric, {
      ...e.viewportPoint,
      color: 'rgba(100, 150, 239, 0.1)',
      size: coverageRadius.value / 180,
      visible: !isHeat.value,
    })
    const Heat = createHeatCircle(fabric, {
      ...e.viewportPoint,
      visible: isHeat.value,
      opacity: slider.value * 0.01,
    })
    canvas.value.add(Group)
    canvas.value.add(Heat)
    let divcolor = ''
    if (mainRouterModel.value == '华为HS8546V5') {
      divcolor = '#ff0'
    } else {
      divcolor = '#0ff'
    }
    const { newDiv, newicon } = addDiv({
      x: e.viewportPoint.x * zoom.value,
      y: e.viewportPoint.y * zoom.value,
      color: divcolor,
    })
    divarr.value.push({
      div: newDiv,
      icon: newicon,
      Group,
      Heat,
      color: divcolor,
      name: '主光猫' + zgmnum.value++,
      size: coverageRadius.value,
      hesize: 20,
    })
  }
  if (nowstatus.value == 2) {
    const Group = createConcentricCircle(fabric, {
      ...e.viewportPoint,
      color: 'rgba(239, 39, 150, 0.1)',
      size: coverageRadius.value / 180,
      visible: !isHeat.value,
    })
    const Heat = createHeatCircle(fabric, {
      ...e.viewportPoint,
      visible: isHeat.value,
      opacity: slider.value * 0.01,
    })
    canvas.value.add(Group)
    canvas.value.add(Heat)
    let divcolor = ''
    if (subRouterModel.value == '华为K662c') {
      divcolor = '#f0f'
    } else {
      divcolor = '#0f0'
    }
    const { newDiv, newicon } = addDiv({
      x: e.viewportPoint.x * zoom.value,
      y: e.viewportPoint.y * zoom.value,
      color: divcolor,
    })
    divarr.value.push({
      div: newDiv,
      icon: newicon,
      Group,
      Heat,
      color: divcolor,
      name: '从光猫' + cgmnum.value++,
      size: coverageRadius.value,
      hesize: 20,
    })
  }
  mouseCircle.visible = false
}

// 触摸
const mouon = e => {
  divarr.value.forEach(item => {
    if (item.icon.id == e.target.id || item.div.id == e.target.id) {
      item.icon.style.display = 'block'
    }
  })
}
// 触摸离开
const mouoff = e => {
  divarr.value.forEach(item => {
    if (item.icon.id == e.target.id || item.div.id == e.target.id) {
      item.icon.style.display = 'none'
    }
  })
}
const isdel = ref(false)
// 删除
const delcanel = e => {
  let matched = false
  divarr.value = divarr.value.filter(item => {
    if (item.icon.id == e.target.id) {
      matched = true
      canvas.value.remove(item.Group)
      canvas.value.remove(item.Heat)
      item.icon.remove()
      item.div.remove()
      return false
    }
    return true
  })
  if (matched) isdel.value = true
  save()
}
// 按下光猫
const timemove = ref([])
const moudo = e => {
  e.stopPropagation() // 阻止冒泡到画布容器，避免触发 handleMouseDown 创建新元素
  divarr.value.forEach(item => {
    if (item.icon.id == e.target.id || item.div.id == e.target.id) {
      timemove.value.push(
        setInterval(() => {
          item.Group.left = xCoord.value
          item.Group.top = yCoord.value
          item.Heat.left = xCoord.value
          item.Heat.top = yCoord.value
          item.div.style.left = xCoord.value * zoom.value - 20 + 'px'
          item.div.style.top = yCoord.value * zoom.value - 20 + 'px'
          canvas.value.renderAll()
        }, 1000 / 24),
      )
    }
  })
}
// 松开
const mouup = e => {
  if (timemove.value.length || isdel.value || wallnow.value) {
    save()
    isdel.value = false
    wallnow.value = false
  }
  while (timemove.value.length) {
    clearInterval(timemove.value.pop())
  }
}

// 鼠标移动事件处理函数（坐标换算已抽取至 utils/coords）
function handleMouseMove(event) {
  const { x, y } = calcCanvasPoint(event, event.currentTarget, zoom)
  xCoord.value = x // 更新x坐标
  yCoord.value = y // 更新y坐标
  if (mouseCircle.visible) {
    canvas.value.remove(mouseCircle)
    mouseCircle = new fabric.Circle({
      radius: 25, // 50px直径的一半
      fill: '',
      stroke: 'blue', // 圆圈颜色
      strokeWidth: 1,
      strokeDashArray: [5, 5], // 虚线样式
      evented: false, // 使圆圈不响应鼠标事件
      visible: true,
      originX: 'center', // 设置原点为中心，这样left和top就是圆心坐标
      originY: 'center',
      left: x, // 圆心坐标
      top: y,
    })
    canvas.value.add(mouseCircle)
  }

  if (wallnow.value) {
    linearr.value[linearr.value.length - 1].line.set({ x2: x, y2: y })
    canvas.value.renderAll()
  }
}

// 按下界面
const zgmnum = ref(0)
const cgmnum = ref(0)
function handleMouseDown() {
  const x = xCoord.value
  const y = yCoord.value

  // 创建整个复合体
  if (nowstatus.value == 1 || nowstatus.value == 2) {
    createdivgm({
      viewportPoint: { x, y },
    })
    nowstatus.value = 0
    save()
  }

  // 创建墙
  if (nowstatus.value == 3) {
    console.log('创建墙')
    wallnow.value = true

    let col = ''
    switch (selectedMaterial.value) {
      case '混凝土':
        col = wallcolor1
        break
      case '砖墙':
        col = wallcolor2
        break
      case '木板':
        col = wallcolor3
        break
      case '玻璃':
        col = wallcolor4
        break
    }
    const line = createWall(fabric, {
      col,
      x1: x,
      y1: y,
    })
    canvas.value.add(line)
    linearr.value.push({ line, color: col })
  }

  // 创建房型
  if (nowstatus.value == 4) {
    if (roomup.value) {
      polypos = [{ x, y }]
      roomup.value = false
      ftxts.forEach(item => {
        canvas.value.remove(item)
      })
      ftxts = []
    } else {
      polypos.push({ x, y })
    }
    canvas.value.remove(poly)
    poly = new fabric.Polygon(polypos, {
      fill: 'rgba(0,0,0,0.1)',
      selectable: false,
    })
    canvas.value.add(poly)

    const txt = new fabric.Text(`${polypos.length}`, {
      left: x,
      top: y,
      fontSize: 16,
    })
    ftxts.push(txt)
    canvas.value.add(txt)
    save()
  }

  // 创建门
  if (nowstatus.value == 5) {
    const d = createdoor(fabric, x, y, doord.value, doorr.value)
    canvas.value.add(d)
    doorarr.value.push(d)
    save()
  }

  canvas.value.renderAll()
}
let poly = null
let polypos = []
let ftxts = []

// 创建墙（逻辑已抽取至 utils/fabricObjects）
const linearr = ref([])
const wallnow = ref(false)
const canvasEl = ref(null)
const ctx = ref(null)

// 初始化画布
onMounted(() => {
  nowcanw.value = canvasplaceholder.value.clientWidth
  nowcanh.value = canvasplaceholder.value.clientHeight
  canvasEl.value = document.getElementById('canvas')
  ctx.value = canvasEl.value.getContext('2d')
  canvas.value = new fabric.Canvas(canvasEl.value, {
    selection: true,
    width: nowcanw.value,
    height: nowcanh.value,
  })
  canvas.value.isDrawingMode = true

  canvas.value.on('selection:created', function () {
    const activeObject = canvas.value.getActiveObject()
    if (activeObject) activeObject.set({ hasControls: false })
  })
  canvas.value.on('object:modified', function (options) {
    const target = options.target
    const transform = options.transform

    // 防御：部分对象（如门 Group）移动时 transform 可能缺失
    if (!target || !transform || !transform.original) return

    // 原始位置
    const originalLeft = transform.original.left
    const originalTop = transform.original.top

    // 当前位置
    const currentLeft = target.left
    const currentTop = target.top

    // 计算移动距离
    const deltaX = currentLeft - originalLeft // X轴移动距离
    const deltaY = currentTop - originalTop // Y轴移动距离
    const activeObjects = canvas.value.getActiveObjects()
    activeObjects.forEach(obj => {
      if (obj instanceof fabric.Line) {
        obj.set({
          x1: obj.x1 + deltaX,
          y1: obj.y1 + deltaY,
          x2: obj.x2 + deltaX,
          y2: obj.y2 + deltaY,
        })
      } else {
        obj.set({ top: obj.top, left: obj.left })
      }
    })
    save()
  })

  // 绘制网格（使用 Fabric.js 的 Line）
  const gridLines = drawGrid(fabric, canvas.value, zoom.value, gridSize)
  gridLines.forEach(l => canvas.value.add(l))
  gridarr.value = gridLines

  // 预览圈
  mouseCircle = new fabric.Circle({
    radius: 25, // 50px直径的一半
    fill: '',
    stroke: 'blue', // 圆圈颜色
    strokeWidth: 1,
    strokeDashArray: [5, 5], // 虚线样式
    evented: false, // 使圆圈不响应鼠标事件
    visible: false,
    originX: 'center', // 设置原点为中心，这样left和top就是圆心坐标
    originY: 'center',
  })
  canvas.value.add(mouseCircle)

  // 默认房型
  polypos = defaultroom.polypos
  poly = createroomUtil(
    fabric,
    {
      canvas: canvas.value,
      linearr: linearr.value,
      doorarr: doorarr.value,
      save,
    },
    defaultroom.walldata,
    polypos,
    defaultroom.door,
  )

  // 绑定事件
  canvasplaceholder.value.addEventListener('mousemove', handleMouseMove)
  canvasplaceholder.value.addEventListener('mousedown', handleMouseDown)
  document.addEventListener('mouseup', mouup)
  // canvas.value.on('mouse:move', handleMouseMove)
  // canvas.value.on('mouse:down', handleMouseDown)
  // canvas.value.on('mouse:up', mouup)
})

// 清空
const clearcanvas = () => {
  divarr.value.forEach(item => {
    canvas.value.remove(item.Group)
    canvas.value.remove(item.Heat)
    item.icon.remove()
    item.div.remove()
  })
  divarr.value = []

  linearr.value.forEach(item => {
    canvas.value.remove(item.line)
  })
  linearr.value = []

  canvas.value.remove(poly)
  polypos = []
  ftxts.forEach(item => {
    canvas.value.remove(item)
  })
  ftxts = []

  doorarr.value.forEach(item => {
    canvas.value.remove(item)
  })
  doorarr.value = []
}

// 弹出框（显隐与编辑数据；确认逻辑已移至 DeviceConfigDialog）
const popshow = ref(false)
const popval = ref('')

const slider = ref(80)
const isHeat = ref(false)

// 热力图显隐
const setHeat = () => {
  isHeat.value = !isHeat.value
  divarr.value.forEach(item => {
    if (isHeat.value) {
      item.Heat.visible = true
      item.Group.visible = false
    } else {
      item.Heat.visible = false
      item.Group.visible = true
    }
  })
  canvas.value.renderAll()
}

// 更新热力图透明度
const sliderchange = () => {
  divarr.value.forEach(item => {
    item.Heat.opacity = slider.value * 0.01
  })
  canvas.value.renderAll()
}

const history = ref([]) // 存储操作历史
const redoStack = ref([]) // 存储撤销历史
// 获取当前状态（逻辑已抽取至 utils/state）
// 保存
const save = async () => {
  redoStack.value = [] // 清空撤销历史
  history.value.push(
    getState({
      divarr: divarr.value,
      linearr: linearr.value,
      doorarr: doorarr.value,
      polypos,
      ftxts,
    }),
  )

  await getclippath(
    fabric,
    divarr.value,
    linearr.value,
    nowcanw.value / zoom.value,
    nowcanh.value / zoom.value,
  )
  canvas.value.renderAll()
  getproportion({
    fabric,
    polypos,
    divarr: divarr.value,
    width: nowcanw.value / zoom.value,
    height: nowcanh.value / zoom.value,
  }).then(res => {
    proportion.value = (res * 100).toFixed(2)
  })
}
// 撤销
const undoState = async () => {
  canvas.value.discardActiveObject()
  // 至少需要一个初始状态才能撤销
  if (history.value.length <= 1) return
  redoStack.value.push(history.value.pop()) // 将当前状态推入撤销历史栈
  readState(history.value[history.value.length - 1]) // 恢复到上一个状态

  await getclippath(
    fabric,
    divarr.value,
    linearr.value,
    nowcanw.value / zoom.value,
    nowcanh.value / zoom.value,
  )
  canvas.value.renderAll()
  getproportion({
    fabric,
    polypos,
    divarr: divarr.value,
    width: nowcanw.value / zoom.value,
    height: nowcanh.value / zoom.value,
  }).then(res => {
    proportion.value = (res * 100).toFixed(2)
  })
}
// 恢复
const recoverState = async () => {
  canvas.value.discardActiveObject()
  if (redoStack.value.length === 0) return
  const st = redoStack.value.pop()
  history.value.push(st) // 将当前状态推入保存历史栈
  readState(st)

  await getclippath(
    fabric,
    divarr.value,
    linearr.value,
    nowcanw.value / zoom.value,
    nowcanh.value / zoom.value,
  )
  canvas.value.renderAll()
  getproportion({
    fabric,
    polypos,
    divarr: divarr.value,
    width: nowcanw.value / zoom.value,
    height: nowcanh.value / zoom.value,
  }).then(res => {
    proportion.value = (res * 100).toFixed(2)
  })
}
// 读取状态
const readState = data => {
  if (!data) return
  clearcanvas() // 清空画布
  data.divarr.forEach(item => {
    // 光猫
    try {
      const x = item.dx
      const y = item.dy
      let mbg
      if (item.dname.includes('主')) {
        mbg = 'rgba(100, 150, 239, 0.1)'
      } else {
        mbg = 'rgba(239, 39, 150, 0.1)'
      }

      const Group = createConcentricCircle(fabric, {
        x,
        y,
        color: mbg,
        size: item.dsize / 180,
        visible: !isHeat.value,
      })

      const Heat = createHeatCircle(fabric, {
        x,
        y,
        size: item.dhes / 20,
        visible: isHeat.value,
        opacity: slider.value * 0.01,
      })
      canvas.value.add(Group)
      canvas.value.add(Heat)

      const { newDiv, newicon } = addDiv({
        x: x * zoom.value,
        y: y * zoom.value,
        color: item.dbg,
        did: item.did,
        iid: item.iid,
      })

      divarr.value.push({
        div: newDiv,
        icon: newicon,
        Group,
        Heat,
        color: item.dbg,
        name: item.dname,
        size: item.dsize,
        hesize: item.dhes,
      })
    } catch (error) {
      console.log(error)
    }
  })

  data.linearr.forEach(item => {
    // 墙
    try {
      const line = createWall(fabric, {
        col: item.lcol,
        x1: item.lx1,
        y1: item.ly1,
        x2: item.lx2,
        y2: item.ly2,
      })
      canvas.value.add(line)
      linearr.value.push({ line, color: item.lcol })
    } catch (error) {
      console.log(error)
    }
  })

  data.doorarr.forEach(item => {
    // 门
    try {
      const d = createdoor(fabric, item.dx, item.dy, item.dd, item.dr)
      canvas.value.add(d)
      doorarr.value.push(d)
    } catch (error) {
      console.log(error)
    }
  })

  // 房间
  try {
    poly = new fabric.Polygon(data.poly, {
      fill: 'rgba(0,0,0,0.1)',
      selectable: false,
    })
    canvas.value.add(poly)
    polypos = [...data.poly]
    ftxts = [...data.txt]
    if (nowstatus.value == 4 && !roomup.value) {
      data.txt.forEach(txt => {
        canvas.value.add(txt)
      })
    }
  } catch (error) {
    console.log(error)
  }
}

const canvasplaceholder = ref()

const nowcanw = ref()
const nowcanh = ref()
// 更新大小
window.addEventListener('resize', () => {
  nowcanw.value = canvasplaceholder.value.clientWidth
  nowcanh.value = canvasplaceholder.value.clientHeight
  canvas.value.setDimensions({
    width: nowcanw.value,
    height: nowcanh.value,
  })
  gridarr.value.forEach(item => {
    canvas.value.remove(item)
  })
  const gridLines = drawGrid(fabric, canvas.value, zoom.value, gridSize)
  gridLines.forEach(l => canvas.value.add(l))
  gridarr.value = gridLines
  if (history.value.length) {
    readState(history.value[history.value.length - 1])
  }
  getclippath(
    fabric,
    divarr.value,
    linearr.value,
    nowcanw.value / zoom.value,
    nowcanh.value / zoom.value,
  )
})

const proportion = ref(0)
// 获取占比（逻辑已抽取至 utils/proportion）

// 绘制墙面模式

import getclippath from '@/utils/getclippath'

// 绘制房型模式
const roomup = ref(false)

// 当前状态变化
watch(nowstatus, val => {
  if (mouseCircle) {
    if (val == 1 || val == 2) mouseCircle.visible = true
    else mouseCircle.visible = false
  }
  ftxts.forEach(txt => {
    canvas.value.remove(txt)
  })
  ftxts = []
  canvas.value.renderAll()
  if (val == 4) roomup.value = polypos.length === 0
})

// 自动添加光猫（逻辑已抽取至 utils/autoAdd）
const autoaddgm = () =>
  autoAddUtil({
    fabric,
    poly,
    polypos,
    divarr: divarr.value,
    linearr: linearr.value,
    canvas: canvas.value,
    coverageRadius: coverageRadius.value,
    nowcanw: nowcanw.value,
    nowcanh: nowcanh.value,
    zoom: zoom.value,
    createdivgm,
    setStatus: val => {
      nowstatus.value = val
    },
    save,
  })

// 创建房间（逻辑已抽取至 utils/room）

// 更新比例尺
const updateScale = e => {
  const num = Number(e)
  if (!isFinite(num) || num <= 0) return
  zoom.value = 1 / num
  canvas.value.setZoom(zoom.value)
  divarr.value.forEach(item => {
    item.div.style.left = item.Heat.left * zoom.value - 20 + 'px'
    item.div.style.top = item.Heat.top * zoom.value - 20 + 'px'
  })
  gridarr.value.forEach(item => {
    canvas.value.remove(item)
  })
  const gridLines = drawGrid(fabric, canvas.value, zoom.value, gridSize)
  gridLines.forEach(l => canvas.value.add(l))
  gridarr.value = gridLines
  if (history.value.length) {
    readState(history.value[history.value.length - 1])
  }
}

// 接收 HeaderBar 上传的房型数据，重建画布
const onUploadRoom = data => {
  if (!data || !data.walldata || !data.walldata.length) {
    ElMessage.warning('图纸数据无效，请检查上传的 JSON 格式')
    return
  }
  clearcanvas()
  poly = createroomUtil(
    fabric,
    {
      canvas: canvas.value,
      linearr: linearr.value,
      doorarr: doorarr.value,
      save,
    },
    data.walldata,
    data.polypos,
  )
  history.value = [
    getState({
      divarr: divarr.value,
      linearr: linearr.value,
      doorarr: doorarr.value,
      polypos,
      ftxts,
    }),
  ]
  redoStack.value = []
}

const delfrel = () => {
  const activeObjects = canvas.value.getActiveObjects()
  if (!activeObjects.length) return
  canvas.value.discardActiveObject()
  linearr.value = linearr.value.filter(i => {
    const del = activeObjects.find(j => j === i.line)
    if (!del) return true
    canvas.value.remove(del)
    return false
  })
  doorarr.value = doorarr.value.filter(i => {
    const del = activeObjects.find(j => j === i)
    if (!del) return true
    canvas.value.remove(del)
    return false
  })
  save()
}

// ===== 面板组件事件回调 =====
const clearAll = () => {
  clearcanvas()
  save()
}
const handleDeleteDevice = value => {
  delcanel({ target: { id: value.icon.id } })
}
const openDeviceConfig = value => {
  popshow.value = true
  // 每次打开重新拷贝，避免弹窗内未确认修改残留；数值字段归一为 Number
  popval.value = {
    ...value,
    size: Number(value.size),
    hesize: Number(value.hesize),
  }
}
</script>

<template>
  <div class="wifi-simulator">
    <!-- 顶部栏 -->
    <HeaderBar
      @upload-room="onUploadRoom"
      @save="save"
    />

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 左侧工具栏 -->
      <LeftToolPanel
        v-model:nowstatus="nowstatus"
        v-model:roomup="roomup"
        v-model:selectedMaterial="selectedMaterial"
        v-model:doord="doord"
        v-model:doorr="doorr"
        @delete-selected="delfrel"
        @auto-add="autoaddgm"
        @undo="undoState"
        @recover="recoverState"
        @clear="clearAll"
      />

      <!-- 中间画布 -->
      <div
        class="canvas-placeholder"
        id="canvasplaceholder"
        ref="canvasplaceholder"
      >
        <canvas id="canvas"></canvas>
      </div>

      <!-- 右侧配置面板 -->
      <RightToolPanel
        v-model:mainRouterModel="mainRouterModel"
        v-model:subRouterModel="subRouterModel"
        v-model:coverageRadius="coverageRadius"
        v-model:scale="scale"
        v-model:slider="slider"
        :is-heat="isHeat"
        :divarr="divarr"
        @update-radius="updateCoverageRadius"
        @update-scale="updateScale"
        @heat-toggle="setHeat"
        @slider-change="sliderchange"
        @delete-device="handleDeleteDevice"
        @open-config="openDeviceConfig"
      />
    </main>

    <!-- 底部状态栏 -->
    <FooterBar
      :scale="scale"
      :x-coord="xCoord"
      :y-coord="yCoord"
      :zoom="zoom"
      :proportion="proportion"
    />

    <!-- 弹出框 -->
    <DeviceConfigDialog
      v-model:show="popshow"
      v-model:device="popval"
      :divarr="divarr"
      @save="save"
    />
  </div>
</template>

<style>
body {
  margin: 0;
}

.wifi-simulator {
  height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: 'Microsoft YaHei', sans-serif;
}

/* 顶部栏 */
.header {
  background-color: #1a2b4d;
  color: white;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: bold;
}

.mode-switch {
  display: flex;
  gap: 10px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

/* 主内容区 */
.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.left-panel,
.right-panel {
  width: 240px;
  background: #f9f9f9;
  border-right: 1px solid #ddd;
  padding: 16px;
  overflow-y: auto;
}

.right-panel {
  border-left: 1px solid #ddd;
  border-right: none;
}

.canvas-placeholder {
  flex: 1;
  position: relative;
  overflow: hidden; /* 防止滚动 */
}

/* 工具栏样式 */
.tool-group {
  margin-bottom: 16px;
}

.tool-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.tool-item:hover {
  background: #f0f0f0;
}

.tool-item.active {
  background: #409eff;
  color: white;
  border-color: #409eff;
}

.tool-subgroup {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

/* 材质选择 */
.material-tabs {
  margin-top: 16px;
}

/* 底部状态栏 */
.footer {
  background-color: #1a2b4d;
  color: white;
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.scale-info {
  text-align: center;
}

.coordinates {
  text-align: right;
}

.addeditem {
  display: flex;
  justify-content: space-between;
  margin: 15px 0;
}

.addeditemcol {
  width: 15px;
  height: 15px;
  background: #ff0;
  border-radius: 50%;
}

label {
  font-weight: bold;
}

.heatimg {
  margin-top: 20px;
  height: 200px;
  background: linear-gradient(90deg, #0f0, #ffff00, #f00);
  border-radius: 4px;
}
</style>
