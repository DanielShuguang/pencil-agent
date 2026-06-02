import type { WorkflowNode, WorkflowEdge } from '@shared/ipc'

export class CycleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CycleError'
  }
}

export function topologicalSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
  const inDegree = new Map<string, number>()
  const adjacency = new Map<string, string[]>()

  // Initialize
  for (const node of nodes) {
    inDegree.set(node.id, 0)
    adjacency.set(node.id, [])
  }

  // Build graph
  for (const edge of edges) {
    const targetDegree = inDegree.get(edge.target) ?? 0
    inDegree.set(edge.target, targetDegree + 1)
    const neighbors = adjacency.get(edge.source) ?? []
    neighbors.push(edge.target)
    adjacency.set(edge.source, neighbors)
  }

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
