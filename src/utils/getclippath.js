/**
 * 墙体阻挡裁剪路径计算模块（getclippath.js）
 *
 * 功能说明：
 *   为每个光猫 Group 计算墙体阻挡区域并设置 clipPath：
 *   遍历承重墙（wallcolor1）墙线，以光猫位置为顶点构造墙体遮挡多边形，
 *   合并所有多边形为复合 Path 后转为 fabric.Path，按光猫大小缩放并挂到 Group.clipPath。
 *   逻辑从 App.vue 中抽取。
 *
 * 使用方式：
 *   import getclippath from '@/utils/getclippath'
 *   await getclippath(fabric, divarr, linearr, nowcanw / zoom, nowcanh / zoom)
 */

import getpolygopoint from './getpolygopoint'
import polygonstoPath from './polygonstoPath'
import pathtofabric from './pathtofabric'
import internallynow from './internallynow'
import { wallcolor1 } from '@/assets/config'

// 已绑定拖动重算监听的 Group（避免重复绑定）
const recalcBoundGroups = new WeakSet()

export default async function getclippath(
  fabric,
  divarr,
  linearr,
  nowcanw,
  nowcanh,
) {
  const blockingLines = linearr.filter(item => item.color === wallcolor1)

  // 1. 遍历所有 Group
  for (let i = 0; i < divarr.length; i++) {
    const groupItem = divarr[i]
    const group = groupItem.Group

    // 2. 为当前 Group 收集所有相关的 Polygon
    let polys = []
    for (let j = 0; j < blockingLines.length; j++) {
      const currentLine = blockingLines[j].line
      const x1 = group.left // Group 的位置
      const y1 = group.top
      const x2 = currentLine.x1
      const y2 = currentLine.y1
      const x3 = currentLine.x2
      const y3 = currentLine.y2

      const { x: x4, y: y4 } = getpolygopoint(
        { x1: x1, y1: y1 },
        { x2: x2, y2: y2 },
        nowcanw,
        nowcanh,
      )
      const { x: x5, y: y5 } = getpolygopoint(
        { x1: x1, y1: y1 },
        { x2: x3, y2: y3 },
        nowcanw,
        nowcanh,
      )

      let polyPoints = [
        { x: x2, y: y2 },
        { x: x3, y: y3 },
        { x: x5, y: y5 },
      ]

      // 处理夹角
      if (x4 != x5 || y4 != y5) {
        let truearr = []
        const internallyarr = [
          { x: 0, y: 0 },
          { x: nowcanw, y: 0 },
          { x: nowcanw, y: nowcanh },
          { x: 0, y: nowcanh },
        ]
        for (const item of internallyarr) {
          const res = internallynow(
            { x: x1, y: y1 },
            { x: x2, y: y2 },
            { x: x3, y: y3 },
            { x: item.x, y: item.y },
          )
          if (res) {
            truearr.push(item)
          }
        }
        if (truearr.length == 1) {
          polyPoints.push({ x: truearr[0].x, y: truearr[0].y })
        } else if (truearr.length == 2) {
          if (truearr[0].x == x5 || truearr[0].y == y5) {
            polyPoints.push({ x: truearr[0].x, y: truearr[0].y })
            polyPoints.push({ x: truearr[1].x, y: truearr[1].y })
          } else {
            polyPoints.push({ x: truearr[1].x, y: truearr[1].y })
            polyPoints.push({ x: truearr[0].x, y: truearr[0].y })
          }
        } else {
          truearr.forEach(item => {
            if (item.x == x5 || item.y == y5) {
              item.num = 1
            }
            if (item.x != x5 && item.x != x4 && item.y != y5 && item.y != y4) {
              item.num = 2
            }
            if (item.x == x4 || item.y == y4) {
              item.num = 3
            }
          })
          truearr.sort((a, b) => a.num - b.num)
          truearr.forEach(item => {
            polyPoints.push({ x: item.x, y: item.y })
          })
        }
      }

      polyPoints.push({ x: x4, y: y4 })

      // 创建代表当前 line 阻挡区域的 Polygon
      const polyForCurrentLine = new fabric.Polygon(polyPoints)
      polys.push(polyForCurrentLine) // 添加到 polys 数组
    }
    // 3. 将所有 Polygon 转换为一个复合的 Path
    const combinedPaperPath = polygonstoPath(polys, nowcanw, nowcanh)

    // 4. 将合并后的 paper.Path 转换为 fabric.Path
    const fabricClipPath = pathtofabric(combinedPaperPath, fabric)

    // 释放临时 paper.Project（polygonstoPath 每次新建，避免离屏实例泄漏）
    if (combinedPaperPath && combinedPaperPath.project) {
      try {
        combinedPaperPath.project.remove()
      } catch (e) {
        // 清理异常不影响已导出的裁剪结果，忽略
      }
    }

    // 5. 计算fabricpath位置
    const sizeNum = Number(divarr[i].size)
    const big = sizeNum > 0 && isFinite(sizeNum) ? 180 / sizeNum : 1

    fabricClipPath.set({
      left: (nowcanw / 2 - group.left) * big,
      top: (nowcanh / 2 - group.top) * big,
      scaleX: big,
      scaleY: big,
    })

    // 6. 设置clipPath
    group.set({ clipPath: fabricClipPath })

    // 设备被拖动后 clipPath 需要按新位置重算（仅绑定一次）
    if (!recalcBoundGroups.has(group)) {
      recalcBoundGroups.add(group)
      group.on('mouseup', () => {
        getclippath(fabric, divarr, linearr, nowcanw, nowcanh)
      })
    }
  }
}
