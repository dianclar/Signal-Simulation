/**
 * 网格绘制模块（grid.js）
 *
 * 功能说明：
 *   在 fabric 画布上按指定缩放与网格间距绘制横竖网格线。
 *   绘制逻辑从 App.vue 的 drawGrid 抽取，函数只负责生成线条对象并返回，
 *   由调用方决定是否加入画布、如何维护网格线数组（如 resize 时需要先移除旧线）。
 *
 * 使用方式：
 *   import drawGrid from './utils/grid'
 *   const lines = drawGrid(fabric, canvas, zoom, gridSize)
 */

/**
 * 绘制网格线
 *
 * 功能说明：
 *   根据画布逻辑宽高（canvas.width / zoom、canvas.height / zoom）按 gridSize / zoom
 *   的间距生成一组浅灰色网格线（竖线 + 横线），返回所有线条对象的数组。
 *   网格线不可选中（selectable: false），线宽随缩放自适应（1 / zoom）。
 *
 * @param {Object} fabric - fabric 命名空间（由 App.vue 的 `import * as fabric from 'fabric'` 传入）
 * @param {Object} canvas - fabric.Canvas 画布实例
 * @param {number} zoom - 当前画布缩放比例（比例尺的倒数，1 / scale）
 * @param {number} gridSize - 网格间距基准值（来自 assets/config 的 gridSize）
 * @returns {fabric.Line[]} 生成的网格线对象数组（调用方自行 canvas.add 并登记）
 */
export default function drawGrid(fabric, canvas, zoom, gridSize) {
  const lines = []
  const width = canvas.width / zoom
  const height = canvas.height / zoom

  const step = gridSize / zoom
  if (!isFinite(step) || step <= 0) return lines

  // 垂直线
  for (let i = 0; i <= width; i += step) {
    const line = new fabric.Line([i, 0, i, height], {
      stroke: '#e0e0e0',
      strokeWidth: Math.max(1 / zoom, 1),
      selectable: false,
    })
    lines.push(line)
  }

  // 水平线
  for (let j = 0; j <= height; j += step) {
    const line = new fabric.Line([0, j, width, j], {
      stroke: '#e0e0e0',
      strokeWidth: Math.max(1 / zoom, 1),
      selectable: false,
    })
    lines.push(line)
  }

  return lines
}
