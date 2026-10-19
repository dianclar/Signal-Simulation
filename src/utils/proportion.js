/**
 * 覆盖占比计算模块（proportion.js）
 *
 * 功能说明：
 *   通过离屏 canvas 渲染光猫覆盖区域与房型多边形，统计覆盖像素数占房型像素数的比例。
 *   逻辑从 App.vue 的 getproportion 抽取：先以房型多边形作为裁剪路径，渲染所有光猫
 *   信号圈，统计非透明像素；再以白色填充同一多边形统计面积，两者相除得到覆盖率。
 *
 * 使用方式：
 *   import getproportion from './utils/proportion'
 *   const res = await getproportion({ fabric, polypos, divarr, width, height })
 */

/**
 * 计算光猫覆盖占比
 *
 * 功能说明：
 *   创建一个离屏 fabric.Canvas（宽高为 width/height），先用 polypos 多边形做裁剪路径，
 *   将 divarr 中所有光猫的 Group 克隆渲染到离屏画布，统计多边形内非透明像素数；
 *   再以白色填充多边形统计总面积，返回两者比值（0~1）。
 *
 * @param {Object} params - 计算参数对象
 * @param {Object} params.fabric - fabric 命名空间（由 App.vue 的 `import * as fabric from 'fabric'` 传入）
 * @param {Array<{x:number, y:number}>} params.polypos - 房型多边形顶点数组（至少 3 个点）
 * @param {Array<Object>} params.divarr - 光猫设备数组（每个元素含 Group 字段，将按 Group.clone() 渲染）
 * @param {number} params.width - 离屏画布宽度（一般为 nowcanw / zoom）
 * @param {number} params.height - 离屏画布高度（一般为 nowcanh / zoom）
 * @returns {Promise<number>} 覆盖占比（0~1 的小数；polypos 顶点不足 3 个时返回 0）
 */
export default async function getproportion({
  fabric,
  polypos,
  divarr,
  width,
  height,
}) {
  if (polypos.length < 3) return 0
  if (!width || !height || width <= 0 || height <= 0) return 0

  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })
  const copycanvas = new fabric.Canvas(tempCanvas, {
    width,
    height,
  })

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

  for (const item of divarr) {
    const Group = await item.Group.clone()
    copycanvas.add(Group)
  }
  copycanvas.renderAll()

  // 统计指定画布上非透明像素数量
  const countOpaquePixels = () => {
    const imageData = tempCtx.getImageData(
      0,
      0,
      tempCanvas.width,
      tempCanvas.height,
    )
    const pixels = imageData.data
    let count = 0
    for (let i = 3; i < pixels.length; i += 4) {
      // 直接跳到 Alpha 通道
      if (pixels[i] > 0) {
        count++
      }
    }
    return count
  }

  const pixelCount = countOpaquePixels()
  tempCtx.fillStyle = 'white'
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
  const pixelCounts = countOpaquePixels()

  copycanvas.dispose() // 释放离屏画布
  return pixelCounts > 0 ? pixelCount / pixelCounts : 0
}
