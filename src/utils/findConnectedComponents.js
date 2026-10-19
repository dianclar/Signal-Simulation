/**
 * 连通区域分析模块（findConnectedComponents.js）
 *
 * 功能说明：
 *   对图像像素数据中的"白色且不透明"像素做 4-邻域 BFS 连通域分析，
 *   返回每个连通区域的面积与质心。用于自动添加光猫时查找房型内未被覆盖的空白区域。
 *
 * 使用方式：
 *   import findConnectedComponents from './utils/findConnectedComponents'
 *   const comps = findConnectedComponents(imageData, width, height)
 */

/**
 * 查找白色像素的连通区域
 *
 * 功能说明：
 *   遍历图像每个像素，对满足 RGB 均为 255 且 Alpha > 0 的未访问像素发起 BFS，
 *   聚合出每个连通区域（4-邻域）的像素集合，计算面积（像素数）与质心坐标；
 *   最后过滤掉面积不大于 10 的微小区域，按面积由大到小（扫描顺序）返回。
 *
 * @param {ImageData} imageData - 图像像素数据（含 data 数组，按 RGBA 顺序排列）
 * @param {number} width - 图像宽度（像素）
 * @param {number} height - 图像高度（像素）
 * @returns {Array<{area: number, centroid: {x: number, y: number}}>}
 *   连通区域列表，每项含 area（像素数量）与 centroid（质心坐标）
 */
export default function findConnectedComponents(imageData, width, height) {
  // 使用二维布尔数组记录已访问的像素
  const visited = Array.from({ length: height }, () =>
    new Array(width).fill(false),
  )
  // 4-邻域方向：上、右、下、左
  const directions = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
  ]
  const pixels = imageData.data
  let components = []

  function bfs(startX, startY) {
    const componentPixels = []
    const queue = [[startX, startY]]
    visited[startY][startX] = true // 标记起始点已访问
    let head = 0

    while (head < queue.length) {
      const [x, y] = queue[head++]
      componentPixels.push([x, y]) // 将当前像素加入区域列表

      // 探索四个方向的邻居
      for (const [dx, dy] of directions) {
        const nx = x + dx
        const ny = y + dy

        // 检查边界、是否已访问、是否为白色且不透明
        if (
          nx >= 0 &&
          nx < width &&
          ny >= 0 &&
          ny < height &&
          !visited[ny][nx] &&
          pixels[(ny * width + nx) * 4] === 255 && // R channel
          pixels[(ny * width + nx) * 4 + 1] === 255 && // G channel
          pixels[(ny * width + nx) * 4 + 2] === 255 && // B channel
          pixels[(ny * width + nx) * 4 + 3] > 0 // A channel
        ) {
          visited[ny][nx] = true // 标记邻居为已访问
          queue.push([nx, ny]) // 将邻居加入队列
        }
      }
    }

    // 计算质心
    const sumX = componentPixels.reduce((sum, [x, y]) => sum + x, 0)
    const sumY = componentPixels.reduce((sum, [x, y]) => sum + y, 0)
    const centroidX = sumX / componentPixels.length
    const centroidY = sumY / componentPixels.length

    return {
      area: componentPixels.length,
      centroid: { x: centroidX, y: centroidY },
      // 注意：这里没有 bbox 字段
    }
  }

  // 遍历整个画布的像素
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // 如果当前像素未被访问过，并且是白色且不透明
      if (
        !visited[y][x] &&
        pixels[(y * width + x) * 4] === 255 && // R channel
        pixels[(y * width + x) * 4 + 1] === 255 && // G channel
        pixels[(y * width + x) * 4 + 2] === 255 && // B channel
        pixels[(y * width + x) * 4 + 3] > 0 // A channel
      ) {
        // 发现一个新的连通区域，开始 BFS 搜索
        const component = bfs(x, y)
        components.push(component) // 将找到的区域加入结果列表
      }
    }
  }

  components = components.filter(component => component.area > 10) // 过滤掉面积小于 10 的连通区域
  return components
}
