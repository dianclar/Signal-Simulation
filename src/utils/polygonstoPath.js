/**
 * 多边形合并裁剪路径模块（polygonstoPath.js）
 *
 * 功能说明：
 *   将多个 fabric.Polygon 转换为 paper.js 路径，从整张画布矩形中依次减去
 *   各多边形区域，得到合并后的复合裁剪路径（paper.Path），供 getclippath 使用。
 *
 * 使用方式：
 *   import polygonstoPath from './utils/polygonstoPath'
 *   const path = polygonstoPath(polys, w, h)
 */

import paper from 'paper'

export default function polygonstoPath(polygons, w, h) {
  const papercanvas = document.createElement('canvas')
  const project = new paper.Project(papercanvas)

  let canvasPaperPath = new paper.Path.Rectangle({
    point: [0, 0],
    size: [w + 2, h + 2],
  })

  polygons.forEach(polygon => {
    const polygonPaperPath = new paper.Path()
    // 将 polygon.points（[{x,y},...]）展平为 [x1,y1,x2,y2,...] 并外扩 1px，
    // 仅作用于本次转换的临时数组，避免修改调用方传入的 polygon.points
    const flatPoints = Array.isArray(polygon.points[0])
      ? polygon.points.flatMap(p => [p[0] + 1, p[1] + 1])
      : typeof polygon.points[0] === 'object'
        ? polygon.points.flatMap(p => [p.x + 1, p.y + 1])
        : polygon.points.map(v => v + 1)
    if (flatPoints.length < 6) return // 少于 3 个点无法构成多边形
    polygonPaperPath.moveTo(flatPoints[0], flatPoints[1])
    for (let j = 2; j < flatPoints.length; j += 2) {
      polygonPaperPath.lineTo(flatPoints[j], flatPoints[j + 1])
    }
    polygonPaperPath.closePath()
    canvasPaperPath = canvasPaperPath.subtract(polygonPaperPath)
  })

  return canvasPaperPath
}
