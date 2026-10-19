/**
 * 创建门复合对象模块（createdoor.js）
 *
 * 功能说明：
 *   创建一扇由弧线门扇（Path）与门板（Rect）组成的 fabric.Group 门对象，
 *   支持设置位置、镜像方向与旋转角度。逻辑从 App.vue 中抽取。
 *
 * 使用方式：
 *   import createdoor from './utils/createdoor'
 *   const door = createdoor(fabric, x, y, direction, rotation)
 */

/**
 * 创建门对象
 *
 * 功能说明：
 *   以固定尺寸的弧形门扇 + 门板组成一个 Group（锚点 originX: 'right' / originY: 'bottom'），
 *   放置在 (x, y) 处；direction 为真时水平镜像并切换锚点为左侧；最后按 rotation 旋转。
 *
 * @param {Object} fabric - fabric 命名空间（由调用方传入 `import * as fabric from 'fabric'`）
 * @param {number} x - 门放置点的 x 坐标（画布逻辑坐标）
 * @param {number} y - 门放置点的 y 坐标（画布逻辑坐标）
 * @param {boolean} [direction] - 是否镜像翻转（逆时针门时为 true）
 * @param {number} [rotation] - 门的旋转角度（单位：度）
 * @returns {fabric.Group} 创建好的门 Group 对象
 */
export default function createdoor(fabric, x, y, direction, rotation) {
  // m x1 y1 a rx ry 0 0 0 x2 y2
  const Path = new fabric.Path('M 40 1 A 50 50 0 0 0 1 40', {
    stroke: '#000',
    strokeWidth: 1,
    fill: '',
    originX: 'left',
    originY: 'top',
  })
  const Rect = new fabric.Rect({
    width: 3,
    height: 38,
    stroke: '#000',
    strokeWidth: 1,
    fill: '',
    originX: 'left',
    originY: 'top',
    left: 36,
    top: 1,
  })
  const Group = new fabric.Group([Path, Rect], {
    left: x,
    top: y,
    originX: 'right',
    originY: 'bottom',
  })
  if (direction) {
    Group.flipX = true
    Group.originX = 'left'
  }
  // 角度归一化到 [0, 360)，避免负角度/超大角度导致序列化与撤销恢复异常
  Group.angle = (((Number(rotation) || 0) % 360) + 360) % 360
  return Group
}
