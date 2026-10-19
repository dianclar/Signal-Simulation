/**
 * 房间创建模块（room.js）
 *
 * 功能说明：
 *   将 App.vue 中的 createroom 逻辑抽取至此：根据房型数据（墙段、多边形顶点、门）
 *   在画布上批量创建墙线、房型多边形与房门，并触发保存。
 *   墙线创建复用 fabricObjects 的 createWall，门创建复用 createdoor。
 *
 * 使用方式：
 *   import createroom from './utils/room'
 *   const poly = createroom(fabric, { canvas, linearr, doorarr, save }, walldata, polypos, door)
 */

import { createWall } from './fabricObjects'
import createdoor from './createdoor'

/**
 * 创建房间（墙线 + 房型多边形 + 门）
 *
 * 功能说明：
 *   1. 遍历 data（墙体分类数组），对每个分类内的每段墙（[x1,y1,x2,y2]）创建墙线，
 *      加入画布并登记到 linearr；
 *   2. 以 polypos 顶点创建半透明房型多边形并加入画布；
 *   3. 遍历 door（门参数数组，元素为 [x, y, direction, rotation]）创建房门并登记到 doorarr；
 *   4. 全部创建完成后调用 ctx.save 保存历史状态；
 *   5. 返回创建的房型多边形对象，由组件持有（用于后续自动布点 / 清空 / 恢复等）。
 *
 * @param {Object} fabric - fabric 命名空间（由 App.vue 的 `import * as fabric from 'fabric'` 传入）
 * @param {Object} ctx - 上下文对象
 * @param {Object} ctx.canvas - fabric.Canvas 实例（canvas.value）
 * @param {Array<Object>} ctx.linearr - 墙线数组（linearr.value，登记 { line, color }）
 * @param {Array<Object>} ctx.doorarr - 门数组（doorarr.value）
 * @param {Function} [ctx.save] - 保存历史状态的回调（组件内 save）
 * @param {Array<Object>} data - 墙体数据数组，每项含 { wall: Array<[x1,y1,x2,y2]>, col: string }
 * @param {Array<{x:number, y:number}>} polypos - 房型多边形顶点数组
 * @param {Array<Array<number|boolean>>} door - 门参数数组，每项为 createdoor 的剩余参数数组
 * @returns {fabric.Polygon} 创建好的房型多边形对象
 */
export default function createroom(fabric, ctx, data, polypos, door) {
  const { canvas, linearr, doorarr } = ctx
  if (!data || !data.length) return null

  data.forEach(item => {
    item.wall.forEach(wall => {
      const line = createWall(fabric, {
        col: item.col,
        x1: wall[0],
        y1: wall[1],
        x2: wall[2],
        y2: wall[3],
      })
      canvas.add(line)
      linearr.push({ line, color: item.col })
    })
  })

  const poly = new fabric.Polygon(polypos, {
    fill: 'rgba(0,0,0,0.1)',
    selectable: false,
  })
  canvas.add(poly)

  ;(door || []).forEach(item => {
    const d = createdoor(fabric, ...item)
    canvas.add(d)
    doorarr.push(d)
  })

  if (ctx.save) ctx.save()

  return poly
}
