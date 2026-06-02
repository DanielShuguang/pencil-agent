import { describe, it, expect } from 'vitest'
import { topologicalSort, CycleError } from '../topological-sort'
import type { WorkflowNode, WorkflowEdge } from '@shared/ipc'

describe('topologicalSort', () => {
  it('should sort simple linear graph', () => {
    const nodes: WorkflowNode[] = [
      { id: 'a', type: 'start', data: {}, position: { x: 0, y: 0 } },
      { id: 'b', type: 'agent', data: {}, position: { x: 0, y: 100 } },
      { id: 'c', type: 'end', data: {}, position: { x: 0, y: 200 } },
    ]
    const edges: WorkflowEdge[] = [
      { id: 'e1', source: 'a', target: 'b' },
      { id: 'e2', source: 'b', target: 'c' },
    ]

    const result = topologicalSort(nodes, edges)
    expect(result).toEqual(['a', 'b', 'c'])
  })

  it('should sort graph with multiple branches', () => {
    const nodes: WorkflowNode[] = [
      { id: 'a', type: 'start', data: {}, position: { x: 0, y: 0 } },
      { id: 'b', type: 'agent', data: {}, position: { x: -100, y: 100 } },
      { id: 'c', type: 'agent', data: {}, position: { x: 100, y: 100 } },
      { id: 'd', type: 'end', data: {}, position: { x: 0, y: 200 } },
    ]
    const edges: WorkflowEdge[] = [
      { id: 'e1', source: 'a', target: 'b' },
      { id: 'e2', source: 'a', target: 'c' },
      { id: 'e3', source: 'b', target: 'd' },
      { id: 'e4', source: 'c', target: 'd' },
    ]

    const result = topologicalSort(nodes, edges)
    expect(result[0]).toBe('a')
    expect(result[3]).toBe('d')
    expect(result.slice(1, 3).sort()).toEqual(['b', 'c'])
  })

  it('should handle single node', () => {
    const nodes: WorkflowNode[] = [
      { id: 'a', type: 'start', data: {}, position: { x: 0, y: 0 } },
    ]
    const edges: WorkflowEdge[] = []

    const result = topologicalSort(nodes, edges)
    expect(result).toEqual(['a'])
  })

  it('should detect cycles', () => {
    const nodes: WorkflowNode[] = [
      { id: 'a', type: 'start', data: {}, position: { x: 0, y: 0 } },
      { id: 'b', type: 'agent', data: {}, position: { x: 0, y: 100 } },
    ]
    const edges: WorkflowEdge[] = [
      { id: 'e1', source: 'a', target: 'b' },
      { id: 'e2', source: 'b', target: 'a' },
    ]

    expect(() => topologicalSort(nodes, edges)).toThrow(CycleError)
  })

  it('should handle disconnected nodes', () => {
    const nodes: WorkflowNode[] = [
      { id: 'a', type: 'start', data: {}, position: { x: 0, y: 0 } },
      { id: 'b', type: 'start', data: {}, position: { x: 100, y: 0 } },
    ]
    const edges: WorkflowEdge[] = []

    const result = topologicalSort(nodes, edges)
    expect(result.sort()).toEqual(['a', 'b'])
  })
})
