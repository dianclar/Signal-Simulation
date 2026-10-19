/**
 * 画布对象工厂模块（fabricObjects.js）
 *
 * 功能说明：
 *   集中管理 App.vue 中各类 fabric 画布复合对象的创建逻辑，
 *   包括光猫信号圈（同心圆）、热力图、墙线等，抽取后便于复用与维护。
 *
 * 使用方式：
 *   import { createConcentricCircle, createHeatCircle, createWall } from './utils/fabricObjects'
 */

/**
 * 创建光猫信号复合对象（同心圆）
 *
 * 功能说明：
 *   以三个半径递增、同色的实心圆组成一个 fabric.Group，用于表示光猫的信号覆盖范围。
 *   组被放置在指定坐标，并按 size 进行整体缩放；visible 控制信号圈在画布上的显隐
 *   （热力图模式开启时隐藏信号圈）。
 *
 * @param {Object} fabric - fabric 命名空间（由 App.vue 的 `import * as fabric from 'fabric'` 传入）
 * @param {Object} options - 创建参数对象
 * @param {number} options.x - 同心圆组中心的 x 坐标（画布逻辑坐标）
 * @param {number} options.y - 同心圆组中心的 y 坐标（画布逻辑坐标）
 * @param {string} options.color - 三个圆的填充颜色（一般为半透明色）
 * @param {number} options.size - 整体缩放系数（一般为 coverageRadius / 180）
 * @param {boolean} [options.visible=true] - 是否在画布上可见（热力图开启时应传 false 以隐藏信号圈）
 * @returns {fabric.Group} 由三个同心圆组成的 Group 对象
 */
export function createConcentricCircle(
  fabric,
  { x, y, color, size, visible = true },
) {
  const radius1 = 30 // 最内层圆半径
  const radius2 = 60 // 中间层圆半径
  const radius3 = 90 // 最外层圆半径

  // 最外层圆 (最浅)
  const circle1 = new fabric.Circle({
    radius: radius1,
    fill: color,
    stroke: null, // 无边框
    strokeWidth: 0,
  })

  // 中间层圆
  const circle2 = new fabric.Circle({
    radius: radius2,
    fill: color,
    stroke: null,
    strokeWidth: 0,
  })

  // 最内层圆 (最深)
  const circle3 = new fabric.Circle({
    radius: radius3,
    fill: color,
    stroke: null,
    strokeWidth: 0,
  })

  // 创建一个组来包含这三个圆
  const concentricCircle = new fabric.Group([circle1, circle2, circle3], {
    originX: 'center',
    originY: 'center',
    left: x,
    top: y,
    scaleX: size,
    scaleY: size,
    selectable: false,
    visible,
  })

  return concentricCircle
}

/**
 * 创建热力复合对象（径向渐变圆）
 *
 * 功能说明：
 *   创建一个带径向渐变的圆形 Group，用于在画布上渲染信号热力图。
 *   渐变颜色由内向外从红色过渡到黄色、绿色、白色，形成热力效果；
 *   整体透明度由 opacity 控制（0~1），缩放由 size 控制。
 *
 * @param {Object} fabric - fabric 命名空间（由 App.vue 的 `import * as fabric from 'fabric'` 传入）
 * @param {Object} options - 创建参数对象
 * @param {number} options.x - 热力图中心的 x 坐标（画布逻辑坐标）
 * @param {number} options.y - 热力图中心的 y 坐标（画布逻辑坐标）
 * @param {number} [options.size=1] - 整体缩放系数（默认 1；恢复历史时一般为 hesize / 20）
 * @param {boolean} [options.visible=false] - 是否在画布上可见（热力图模式开启时应传 true）
 * @param {number} [options.opacity=0.8] - 热力图整体透明度（一般为 slider * 0.01）
 * @returns {fabric.Group} 由径向渐变圆组成的 Group 对象
 */
export function createHeatCircle(
  fabric,
  { x, y, size = 1, visible = false, opacity = 0.8 },
) {
  const radius1 = 150

  const circle1 = new fabric.Circle({
    radius: radius1,
    fill: new fabric.Gradient({
      type: 'radial', // 径向渐变
      colorStops: [
        { offset: 0, color: `rgba(255, 0, 0, 1)` },
        { offset: 0.35, color: `rgba(255, 200, 0, 0.5)` },
        { offset: 0.5, color: `rgba(255, 255, 255, 0.5)` },
        { offset: 0.7, color: `rgba(255, 255, 0, 0.5)` },
        { offset: 0.75, color: 'rgba(0, 255, 0, 0.5)' },
        { offset: 0.95, color: 'rgba(0, 255, 0, 0.1)' },
        { offset: 1, color: 'rgba(255, 255, 255, 0.1)' },
      ],
      coords: {
        x1: radius1, // 起始圆心x坐标
        y1: radius1, // 起始圆心y坐标
        r1: 0, // 起始圆半径，通常为0
        x2: radius1, // 结束圆心x坐标
        y2: radius1, // 结束圆心y坐标
        r2: radius1, // 结束圆半径，与圆形对象的半径相同
      },
    }),
    stroke: null, // 无边框
    strokeWidth: 0,
  })

  // 创建一个组来包含热力圆
  const concentricCircle = new fabric.Group([circle1], {
    originX: 'center',
    originY: 'center',
    left: x,
    top: y,
    visible,
    opacity,
    scaleX: size,
    scaleY: size,
    selectable: false,
  })

  return concentricCircle
}

/**
 * 创建墙线（fabric.Line）
 *
 * 功能说明：
 *   根据起止坐标与墙体颜色创建一条墙线对象。若未提供终点坐标（x2/y2），
 *   则退化为起点坐标相同的短线（用于鼠标按下但尚未拖动的场景）。
 *   注意：本函数只负责创建对象，不执行 canvas.add 与 linearr 登记，
 *   由调用方自行添加进画布并维护墙线数组。
 *
 * @param {Object} fabric - fabric 命名空间（由 App.vue 的 `import * as fabric from 'fabric'` 传入）
 * @param {Object} options - 创建参数对象
 * @param {string} options.col - 墙线颜色（来自 assets/config 的 wallcolor1~4）
 * @param {number} options.x1 - 起点 x 坐标（画布逻辑坐标）
 * @param {number} options.y1 - 起点 y 坐标（画布逻辑坐标）
 * @param {number} [options.x2] - 终点 x 坐标（缺省时取 x1）
 * @param {number} [options.y2] - 终点 y 坐标（缺省时取 y1）
 * @returns {fabric.Line} 创建好的墙线对象
 */
export function createWall(fabric, { col, x1, y1, x2, y2 }) {
  const line = new fabric.Line([x1, y1, x2 || x1, y2 || y1], {
    stroke: col,
    strokeWidth: 3,
    evented: true,
  })
  return line
}
