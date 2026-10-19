/**
 * 自动添加光猫模块（autoAdd.js）
 *
 * 功能说明：
 *   将 App.vue 中的 autoaddgm 超大体量逻辑整体抽取至此：
 *   在房型多边形内按"错排网格"批量放置主/从光猫，随后通过离屏 canvas 染色 +
 *   连通区域分析做第二轮"查缺补漏"，直到不存在未覆盖的空白区域。
 *   所有对组件状态（divarr / linearr / canvas / poly / polypos / nowstatus）的访问
 *   均通过 ctx 上下文对象传入，组件通过回调（createdivgm / setStatus / save）协作。
 *
 * 使用方式：
 *   import autoaddgm from './utils/autoAdd'
 *   autoaddgm({ fabric, poly, polypos, divarr, linearr, canvas, coverageRadius, nowcanw, nowcanh, zoom, createdivgm, setStatus, save })
 */

import { ElMessage, ElMessageBox } from 'element-plus'
import getclippath from './getclippath'
import findConnectedComponents from './findConnectedComponents'

/**
 * 自动添加光猫（主入口）
 *
 * 功能说明：
 *   1. 校验房型是否有效（poly 至少 3 个顶点），无效时提示；
 *   2. 弹窗确认后清空所有已存在光猫；
 *   3. 以覆盖半径的 0.8 倍为间距，在房型包围盒内做错排网格扫描，把位于多边形内部的
 *      网格点依次创建为光猫（首个为主光猫，其余为从光猫）；
 *   4. 用离屏 canvas 将房型渲染成白色、光猫渲染成半透明白，通过连通区域分析找出
 *      未被覆盖的空白区域，继续在其中点补充光猫，直至无剩余空白；
 *   5. 全部完成后重置状态并触发保存。
 *
 * @param {Object} ctx - 上下文对象（由 App.vue 组装传入）
 * @param {Object} ctx.fabric - fabric 命名空间（`import * as fabric from 'fabric'` 的引用）
 * @param {Object} ctx.poly - 当前房型多边形对象（fabric.Polygon，须含 points / getBoundingRect）
 * @param {Array<{x:number, y:number}>} ctx.polypos - 房型多边形顶点数组
 * @param {Array<Object>} ctx.divarr - 光猫设备数组（引用 divarr.value）
 * @param {Array<Object>} ctx.linearr - 墙线数组（引用 linearr.value，供 getclippath 计算阻挡）
 * @param {Object} ctx.canvas - fabric.Canvas 实例（引用 canvas.value）
 * @param {number} ctx.coverageRadius - 当前覆盖半径（引用 coverageRadius.value）
 * @param {number} ctx.nowcanw - 画布容器逻辑宽度（引用 nowcanw.value）
 * @param {number} ctx.nowcanh - 画布容器逻辑高度（引用 nowcanh.value）
 * @param {number} ctx.zoom - 当前画布缩放比例
 * @param {Function} ctx.createdivgm - 创建光猫复合体的回调（接收 { viewportPoint: {x, y} }）
 * @param {Function} ctx.setStatus - 设置当前绘制状态的回调（如 val => nowstatus.value = val）
 * @param {Function} ctx.save - 保存历史状态的回调（组件内 save）
 * @returns {Promise<void>} 无返回值；异常由组件捕获处理
 */
export default async function autoaddgm(ctx) {
  const {
    fabric,
    poly,
    polypos,
    divarr,
    linearr,
    canvas,
    coverageRadius,
    nowcanw,
    nowcanh,
    zoom,
    createdivgm,
    setStatus,
    save,
  } = ctx

  if (!poly || poly.points.length < 3)
    return ElMessage.warning('请先绘制有效房型')

  try {
    await ElMessageBox.confirm('该操作会删除所有已存在的光猫', '温馨提示', {
      confirmButtonText: '继续',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch (err) {
    return // 用户取消
  }

  save() // 清空前先保存当前状态，便于撤销恢复
  divarr.forEach(item => {
    canvas.remove(item.Group)
    canvas.remove(item.Heat)
    item.icon.remove()
    item.div.remove()
  })
  divarr.length = 0

  // 估算覆盖范围
  const radiusNum = Number(coverageRadius)
  if (!isFinite(radiusNum) || radiusNum <= 0) {
    return ElMessage.warning('覆盖半径必须大于 0，请先设置有效的覆盖半径')
  }
  const effectiveRadius = radiusNum // 直径
  const spacing = effectiveRadius * 0.8 // 间距稍微小于直径，确保覆盖重叠
  const halfSpacing = spacing / 2 // 用于错开的半个间距

  // 获取多边形边界框
  const bounds = poly.getBoundingRect()
  const startX = bounds.left
  const startY = bounds.top
  const endX = bounds.left + bounds.width
  const endY = bounds.top + bounds.height

  let firstgm = true

  // 遍历边界框内的网格，实现错排
  for (let row = 0; startY + spacing / 2.6 + row * spacing < endY; row++) {
    const y = startY + spacing / 2.6 + row * spacing // 当前行的 Y 坐标

    // 计算当前行的起始 X 坐标，奇数行错开 halfSpacing
    const offsetX = row % 2 === 0 ? 0 : halfSpacing
    for (let x = startX + spacing / 2.6 + offsetX; x < endX; x += spacing) {
      // 检查点是否在多边形内部
      let inside = false

      // 遍历多边形的每条边
      for (
        let i = 0, j = poly.points.length - 1;
        i < poly.points.length;
        j = i++
      ) {
        const xi = poly.points[i].x
        const yi = poly.points[i].y
        const xj = poly.points[j].x
        const yj = poly.points[j].y

        // 检查点 (x, y) 是否穿过边 (xi, yi)-(xj, yj)
        const intersect =
          yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
        if (intersect) inside = !inside
      }
      if (inside) {
        // 在该点创建光猫
        if (firstgm) {
          setStatus(1)
          firstgm = false
        } else {
          setStatus(2)
        }
        createdivgm({
          viewportPoint: { x, y },
        })
        await new Promise(resolve => setTimeout(resolve, 1))
      }
    }
  }

  // 添加阻挡
  getclippath(fabric, divarr, linearr, nowcanw / zoom, nowcanh / zoom)

  // 第二轮查缺补漏
  if (!nowcanw || !nowcanh || nowcanw <= 0 || nowcanh <= 0) {
    return ElMessage.warning('画布尺寸无效，请先完成画布初始化')
  }
  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })
  const copycanvas = new fabric.Canvas(tempCanvas, {
    width: nowcanw / zoom,
    height: nowcanh / zoom,
  })
  // 离屏画布与主画布逻辑尺寸一致（tempCanvas.width = nowcanw / zoom），缩放比恒为 1:1
  const wx = 1
  const wy = 1

  // 开始一个新的路径
  tempCtx.beginPath()

  // 将路径移动到第一个点的位置
  tempCtx.moveTo(polypos[0].x, polypos[0].y)

  // 遍历 polypos 数组中的每个点，并将它们连接起来形成一个多边形
  for (let i = 1; i < polypos.length; i++) {
    tempCtx.lineTo(polypos[i].x, polypos[i].y)
  }

  // 闭合路径（从最后一个点回到第一个点）
  tempCtx.closePath()

  // 设置当前路径为剪辑路径
  tempCtx.clip()

  // 染色
  for (const item of divarr) {
    const Group = await item.Group.clone()
    copycanvas.add(Group)
  }
  copycanvas.renderAll()
  tempCtx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)

  let last = null
  let iterations = 0 // 防死循环：最多迭代 20 轮补点
  while (iterations < 20) {
    iterations++
    // 取坐标
    let imageData = tempCtx.getImageData(
      0,
      0,
      tempCanvas.width,
      tempCanvas.height,
    )

    let data = findConnectedComponents(
      imageData,
      tempCanvas.width,
      tempCanvas.height,
    )
    console.log(data)
    data = data.filter(item => {
      if (!last) return true
      return !last.some(lastItem => lastItem.area == item.area)
    })

    if (data.length == 0) break
    last = data

    // 补光猫
    for (const item of data) {
      const x = item.centroid.x * wx
      const y = item.centroid.y * wy
      if (firstgm) {
        setStatus(1)
      } else {
        setStatus(2)
      }
      createdivgm({
        viewportPoint: { x, y },
      })
      await getclippath(fabric, divarr, linearr, nowcanw / zoom, nowcanh / zoom)
      const Group = await divarr[divarr.length - 1].Group.clone()
      copycanvas.add(Group)
      await new Promise(resolve => setTimeout(resolve, 1))
    }
    tempCtx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
  }
  setStatus(0)
  save()
}
