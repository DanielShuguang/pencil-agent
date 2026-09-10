import type { WorkflowNode, WorkflowEdge } from '@shared/ipc'

export class CycleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CycleError'
  }
}

interface Graph {
  inDegree: Map<string, number>
  adjacency: Map<string, string[]>
}

/**
 * 构建入度表与邻接表。
 *
 * 同一条 `source → target` 边只计一次，避免并行边（用户在画布上重复连线）
 * 让入度永远无法归零，从而被误判为环。
 */
function buildGraph(nodes: WorkflowNode[], edges: WorkflowEdge[]): Graph {
  const inDegree = new Map<string, number>()
  const adjacency = new Map<string, string[]>()
  const seen = new Set<string>()

  for (const node of nodes) {
    inDegree.set(node.id, 0)
    adjacency.set(node.id, [])
  }

  for (const edge of edges) {
    if (!inDegree.has(edge.source) || !inDegree.has(edge.target)) continue
    const key = `${edge.source}\u0000${edge.target}`
    if (seen.has(key)) continue
    seen.add(key)

    inDegree.set(edge.target, inDegree.get(edge.target)! + 1)
    adjacency.get(edge.source)!.push(edge.target)
  }

  return { inDegree, adjacency }
}

export function topologicalSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
  const { inDegree, adjacency } = buildGraph(nodes, edges)

  // Kahn's Algorithm
  const queue: string[] = []
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(nodeId)
    }
  }

  const result: string[] = []

  while (queue.length > 0) {
    const nodeId = queue.shift()!
    result.push(nodeId)

    for (const neighbor of adjacency.get(nodeId) ?? []) {
      const degree = inDegree.get(neighbor)! - 1
      inDegree.set(neighbor, degree)
      if (degree === 0) {
        queue.push(neighbor)
      }
    }
  }

  // Cycle detection
  if (result.length !== nodes.length) {
    throw new CycleError('Workflow contains a cycle')
  }

  return result
}

/**
 * 按拓扑层次切分节点：同一层内的节点互不依赖，可以并行执行。
 */
export function calculateExecutionLayers(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
): string[][] {
  const { inDegree, adjacency } = buildGraph(nodes, edges)
  const layers: string[][] = []
  const visited = new Set<string>()

  while (visited.size < nodes.length) {
    const currentLayer: string[] = []

    for (const [nodeId, degree] of inDegree) {
      if (degree === 0 && !visited.has(nodeId)) {
        currentLayer.push(nodeId)
      }
    }

    if (currentLayer.length === 0) {
      throw new CycleError('Workflow contains a cycle')
    }

    layers.push(currentLayer)

    for (const nodeId of currentLayer) {
      visited.add(nodeId)
      for (const neighbor of adjacency.get(nodeId) ?? []) {
        inDegree.set(neighbor, inDegree.get(neighbor)! - 1)
      }
    }
  }

  return layers
}
