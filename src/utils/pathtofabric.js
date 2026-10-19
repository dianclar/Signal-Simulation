/**
 * paper.Path 转 fabric.Path 模块（pathtofabric.js）
 *
 * 功能说明：
 *   将 paper.js 的 Path 对象导出为 SVG 字符串，提取其中的 d 路径数据，
 *   创建对应的 fabric.Path 对象（fillRule: 'evenodd'），用于墙体阻挡裁剪。
 *
 * 使用方式：
 *   import pathtofabric from './utils/pathtofabric'
 *   const path = pathtofabric(paperPath, fabric)
 */

/**
 * 将 paper.Path 转换为 fabric.Path
 *
 * 功能说明：
 *   通过 exportSVG 拿到 d 属性并解析出路径命令串，构造新的 fabric.Path。
 *
 * @param {Object} paperPath - paper.js 的 Path 对象（须支持 exportSVG）
 * @param {Object} fabric - fabric 命名空间（由调用方传入 `import * as fabric from 'fabric'`）
 * @returns {fabric.Path} 转换得到的 fabric.Path 对象
 */
export default function pathtofabric(paperPath, fabric) {
  const svg = paperPath.exportSVG({ asString: true })
  const dMatch = svg && svg.match(/d="([^"]*)"/)
  if (!dMatch || !dMatch[1]) return null
  return new fabric.Path(dMatch[1], { fillRule: 'evenodd' })
}
