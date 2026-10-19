/**
 * 画布状态序列化模块（state.js）
 *
 * 功能说明：
 *   将 App.vue 中的 getState 逻辑抽取至此：把当前画布上的光猫设备、墙线、门、
 *   房型顶点与顶点序号文本序列化为可持久化的纯数据对象，供撤销/恢复历史栈使用。
 *
 * 使用方式：
 *   import getState from './utils/state'
 *   const savearr = getState({ divarr, linearr, doorarr, polypos, ftxts })
 */

/**
 * 获取当前画布状态
 *
 * 功能说明：
 *   分别从 divarr（光猫设备）、linearr（墙线）、doorarr（门）中提取坐标/颜色/ID 等
 *   关键字段，连同房型顶点（polypos）与顶点序号文本（ftxts）一起打包为纯对象返回。
 *   返回结构可被 readState（组件内）反向恢复。
 *
 * @param {Object} params - 序列化参数对象
 * @param {Array<Object>} params.divarr - 光猫设备数组（每项含 name/size/hesize/div/icon/Group/Heat）
 * @param {Array<Object>} params.linearr - 墙线数组（每项含 { line, color }，line 含 x1/y1/x2/y2）
 * @param {Array<Object>} params.doorarr - 门数组（每项含 left/top/flipX/angle）
 * @param {Array<{x:number, y:number}>} params.polypos - 房型多边形顶点数组
 * @param {Array<Object>} params.ftxts - 顶点序号文本数组（fabric.Text 对象）
 * @returns {Object} 序列化后的画布状态对象（含 divarr/linearr/doorarr/poly/txt 四个字段）
 */
export default function getState({ divarr, linearr, doorarr, polypos, ftxts }) {
  const savearr = {}
  divarr = divarr || []
  linearr = linearr || []
  doorarr = doorarr || []
  polypos = polypos || []
  ftxts = ftxts || []
  savearr.divarr = divarr.map(item => ({
    dname: item.name,
    dsize: item.size,
    dhes: item.hesize,
    dbg: item.color || item.div.style.background,
    did: item.div.id,
    iid: item.icon.id,
    dx: item.Heat.left,
    dy: item.Heat.top,
  }))
  savearr.linearr = linearr.map(item => ({
    lx1: item.line.x1,
    ly1: item.line.y1,
    lx2: item.line.x2,
    ly2: item.line.y2,
    lcol: item.color,
  }))
  savearr.doorarr = doorarr.map(item => ({
    dx: item.left,
    dy: item.top,
    dd: item.flipX,
    dr: item.angle,
  }))
  savearr.poly = [...polypos]
  savearr.txt = [...ftxts]
  return savearr
}
