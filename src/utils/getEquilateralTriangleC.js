/**
 * 等边三角形顶点计算模块（getEquilateralTriangleC.js）
 *
 * 功能说明：
 *   给定线段 AB 的端点坐标，按 -60° 旋转矩阵计算等边三角形的第三个顶点 C，
 *   使 ABC 构成以 AB 为一边的等边三角形（C 在 AB 顺时针 -60° 方向一侧）。
 *
 * 使用方式：
 *   import getEquilateralTriangleC from './utils/getEquilateralTriangleC'
 *   const { x, y } = getEquilateralTriangleC(ax, ay, bx, by)
 */

/**
 * 计算等边三角形第三个顶点
 *
 * 功能说明：
 *   以 A 点为旋转中心，将向量 AB 逆时针旋转 -60°（即顺时针 60°），
 *   得到向量 AC，再加到 A 点上得到 C 点坐标。
 *
 * @param {number} ax - 点 A 的 x 坐标
 * @param {number} ay - 点 A 的 y 坐标
 * @param {number} bx - 点 B 的 x 坐标
 * @param {number} by - 点 B 的 y 坐标
 * @returns {{x: number, y: number}} 等边三角形第三个顶点 C 的坐标
 */
export default function getEquilateralTriangleC(ax, ay, bx, by) {
  // 1. 计算向量 AB
  const vectorAB_x = bx - ax
  const vectorAB_y = by - ay

  // 2. 定义旋转角度 (弧度)
  const angleDegrees = -60
  const angleRadians = (Math.PI / 180) * angleDegrees // 将角度转换为弧度

  // 3. 计算 cos(60°) 和 sin(60°)
  const cosTheta = Math.cos(angleRadians) // cos(60°) = 0.5
  const sinTheta = Math.sin(angleRadians) // sin(60°) ≈ 0.866

  // 4. 应用旋转矩阵计算向量 AC
  // 新向量 x = old_x * cos - old_y * sin
  // 新向量 y = old_x * sin + old_y * cos
  const vectorAC_x = vectorAB_x * cosTheta - vectorAB_y * sinTheta
  const vectorAC_y = vectorAB_x * sinTheta + vectorAB_y * cosTheta

  // 5. 计算点 C 的坐标 (点 A + 向量 AC)
  const pointC_x = ax + vectorAC_x
  const pointC_y = ay + vectorAC_y

  return { x: pointC_x, y: pointC_y }
}
