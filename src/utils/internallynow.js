/**
 * 点在角内判断模块（internallynow.js）
 *
 * 功能说明：
 *   判断点 D 是否位于以 A 为顶点、射线 AB 与 AC 构成的角（夹角）内部（含边界/共线）。
 *   用于墙体阻挡多边形顶点筛选。
 *
 * 使用方式：
 *   import internallynow from './utils/internallynow'
 *   const inside = internallynow(pointA, pointB, pointC, pointD)
 */

/**
 * 判断点 D 是否在角 ∠BAC 内部
 *
 * 功能说明：
 *   通过向量叉积判断方向关系：若 AB 与 AC 共线（cross == 0）直接认为在角内；
 *   否则根据 AB→AC 的旋向，校验 AD 是否同时落在 AB 与 AC 的同侧（含共线）。
 *
 * @param {{x: number, y: number}} pointA - 角的顶点 A
 * @param {{x: number, y: number}} pointB - 角的一边方向点 B
 * @param {{x: number, y: number}} pointC - 角的另一边方向点 C
 * @param {{x: number, y: number}} pointD - 待判断的点 D
 * @returns {boolean} D 在角内（含边界）返回 true，否则 false
 */
export default function internallynow(pointA, pointB, pointC, pointD) {
  const AB_x = pointB.x - pointA.x
  const AB_y = pointB.y - pointA.y
  const AC_x = pointC.x - pointA.x
  const AC_y = pointC.y - pointA.y
  const AD_x = pointD.x - pointA.x
  const AD_y = pointD.y - pointA.y

  const cross_AB_AC = AB_x * AC_y - AB_y * AC_x

  if (cross_AB_AC === 0) {
    // AB 与 AC 共线（夹角为 0° 或 180°）：仅当 D 与角两侧共线时视为在角内，
    // 避免把所有点都判为角内导致遮挡多边形退化
    return cross_AB_AD === 0
  }

  const cross_AB_AD = AB_x * AD_y - AB_y * AD_x
  const cross_AD_AC = AD_x * AC_y - AD_y * AC_x

  if (cross_AB_AC < 0) {
    // AC 在 AB 逆时针方向 (夹角是 AB 逆时针扫到 AC)
    // D 要在角内:
    // - AD 应在 AB 逆时针或共线 (cross_AB_AD < 0 或 == 0)
    // - AD 应在 AC 顺时针或共线 (cross_AC_AD > 0 或 == 0) -> 即 cross_AD_AC < 0 或 == 0
    return cross_AB_AD <= 0 && cross_AD_AC <= 0
  } else {
    // cross_AB_AC > 0, AC 在 AB 顺时针方向 (夹角是 AB 顺时针扫到 AC)
    // D 要在角内:
    // - AD 应在 AB 顺时针或共线 (cross_AB_AD > 0 或 == 0)
    // - AD 应在 AC 逆时针或共线 (cross_AC_AD > 0 或 == 0) -> 即 cross_AD_AC < 0 或 == 0
    return cross_AB_AD >= 0 && cross_AD_AC >= 0
  }
}
