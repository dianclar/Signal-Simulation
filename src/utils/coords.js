/**
 * 坐标计算模块（coords.js）
 *
 * 功能说明：
 *   提供鼠标事件坐标与画布逻辑坐标之间的换算工具。
 *   逻辑从 App.vue 的 handleMouseMove 中抽取，统一处理浏览器坐标到
 *   画布逻辑坐标（已除以缩放比例 zoom）的换算，避免各调用处重复实现。
 *
 * 使用方式：
 *   import calcCanvasPoint from './utils/coords'
 *   const { x, y } = calcCanvasPoint(event, event.currentTarget, zoom)
 */

/**
 * 计算鼠标事件对应的画布逻辑坐标
 *
 * 功能说明：
 *   获取事件目标元素的边界矩形（getBoundingClientRect），
 *   用鼠标客户端坐标减去元素左上角偏移，再除以缩放比例 zoom，
 *   得到画布逻辑坐标系下的整数坐标。
 *
 * @param {Event} event - 鼠标事件对象（须包含 clientX / clientY）
 * @param {Element} currentTarget - 事件当前目标元素（用于 getBoundingClientRect）
 * @param {number} zoom - 当前画布缩放比例（1 / scale）
 * @returns {{x: number, y: number}} 画布逻辑坐标（四舍五入取整）
 */
export default function calcCanvasPoint(event, currentTarget, zoom) {
  const rect = currentTarget.getBoundingClientRect()
  const x = Math.round((event.clientX - rect.left) / zoom)
  const y = Math.round((event.clientY - rect.top) / zoom)
  return { x, y }
}
