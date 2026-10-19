/**
 * 射线与画布边界交点计算模块（getpolygopoint.js）
 *
 * 功能说明：
 *   从起点向终点方向发射射线，计算该射线与画布矩形边界（0~maxWidth / 0~maxHeight）
 *   的交点坐标，用于把墙线向画布外延长到边界处，构造裁剪多边形。
 *
 * 使用方式：
 *   import getpolygopoint from './utils/getpolygopoint'
 *   const { x, y } = getpolygopoint(startPoint, endPoint, maxWidth, maxHeight)
 */

/**
 * 计算射线与画布边界的交点
 *
 * 功能说明：
 *   对方向向量 (dx, dy) 分别求与四条边界相交的参数 t，取最小正 t 对应的交点，
 *   保证交点落在起点朝终点方向的射线上且不超出画布。
 *
 * @param {{x1: number, y1: number}} startPoint - 射线起点
 * @param {{x2: number, y2: number}} endPoint - 射线方向参考终点（用于求方向向量）
 * @param {number} maxWidth - 画布逻辑宽度（边界 x ∈ [0, maxWidth]）
 * @param {number} maxHeight - 画布逻辑高度（边界 y ∈ [0, maxHeight]）
 * @returns {{x: number, y: number}} 射线与画布边界的交点坐标
 */
export default function getpolygopoint(
  startPoint,
  endPoint,
  maxWidth,
  maxHeight,
) {
  const { x1, y1 } = startPoint
  const { x2, y2 } = endPoint

  // 计算方向向量
  const dx = x2 - x1
  const dy = y2 - y1

  // 初始化 t 的最大值为无穷大
  let tMax = Infinity

  // 计算与四条边界的交点参数 t
  if (dx > 0) {
    tMax = Math.min(tMax, (maxWidth - x1) / dx)
  } else if (dx < 0) {
    tMax = Math.min(tMax, (0 - x1) / dx)
  }

  if (dy > 0) {
    tMax = Math.min(tMax, (maxHeight - y1) / dy)
  } else if (dy < 0) {
    tMax = Math.min(tMax, (0 - y1) / dy)
  }

  // 使用最小的 t 值计算交点坐标
  const t = tMax
  if (!isFinite(t)) {
    // 退化：起终点重合或方向向量为零，直接返回终点
    return { x: x2, y: y2 }
  }
  return { x: x1 + t * dx, y: y1 + t * dy }
}
