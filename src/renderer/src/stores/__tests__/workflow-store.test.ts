import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Node, Edge } from '@xyflow/react'
import { useWorkflowStore } from '../workflow-store'

beforeEach(() => {
  useWorkflowStore.setState({
    nodes: [],
    edges: [],
    selectedNodeId: null,
    nodeStatus: new Map(),
    isExecuting: false,
  })
})

const mockNode = (id: string): Node => ({
  id,
  type: 'default',
  position: { x: 0, y: 0 },
  data: { label: `Node ${id}` },
})

describe('workflow-store', () => {
  it('default state', () => {
    const state = useWorkflowStore.getState()
    expect(state.nodes).toEqual([])
    expect(state.edges).toEqual([])
    expect(state.selectedNodeId).toBeNull()
    expect(state.isExecuting).toBe(false)
  })

  it('setNodes replaces all nodes', () => {
    const nodes = [mockNode('1'), mockNode('2')]
    useWorkflowStore.getState().setNodes(nodes)
    expect(useWorkflowStore.getState().nodes).toEqual(nodes)
  })

  it('setEdges replaces all edges', () => {
    const edges: Edge[] = [{ id: 'e1-2', source: '1', target: '2' }]
    useWorkflowStore.getState().setEdges(edges)
    expect(useWorkflowStore.getState().edges).toEqual(edges)
  })

  it('addNode appends a node', () => {
    useWorkflowStore.getState().addNode(mockNode('1'))
    useWorkflowStore.getState().addNode(mockNode('2'))
    expect(useWorkflowStore.getState().nodes).toHaveLength(2)
  })

  it('removeNode removes a node and its connected edges', () => {
    useWorkflowStore.setState({
      nodes: [mockNode('1'), mockNode('2'), mockNode('3')],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e2-3', source: '2', target: '3' },
      ],
    })
    useWorkflowStore.getState().removeNode('1')
    expect(useWorkflowStore.getState().nodes).toHaveLength(2)
    expect(useWorkflowStore.getState().nodes.map((n) => n.id)).not.toContain('1')
    expect(useWorkflowStore.getState().edges).toHaveLength(1)
    expect(useWorkflowStore.getState().edges[0].id).toBe('e2-3')
  })

  it('onNodesChange applies node changes through xyflow', () => {
    const node = mockNode('1')
    useWorkflowStore.setState({ nodes: [node] })
    useWorkflowStore
      .getState()
      .onNodesChange([{ type: 'position', id: '1', position: { x: 100, y: 200 }, dragging: false }])
    const updated = useWorkflowStore.getState().nodes[0]
    expect(updated.position).toEqual({ x: 100, y: 200 })
  })

  it('onConnect adds an edge between nodes', () => {
    useWorkflowStore.setState({ nodes: [mockNode('1'), mockNode('2')] })
    useWorkflowStore
      .getState()
      .onConnect({ source: '1', target: '2', sourceHandle: null, targetHandle: null })
    expect(useWorkflowStore.getState().edges).toHaveLength(1)
    expect(useWorkflowStore.getState().edges[0].source).toBe('1')
    expect(useWorkflowStore.getState().edges[0].target).toBe('2')
  })

  it('selectNode sets selectedNodeId', () => {
    useWorkflowStore.getState().selectNode('1')
    expect(useWorkflowStore.getState().selectedNodeId).toBe('1')
  })

  it('selectNode null clears selection', () => {
    useWorkflowStore.setState({ selectedNodeId: '1' })
    useWorkflowStore.getState().selectNode(null)
    expect(useWorkflowStore.getState().selectedNodeId).toBeNull()
  })

  it('updateNodeData merges data into node', () => {
    useWorkflowStore.setState({ nodes: [{ ...mockNode('1'), data: { label: 'Old' } }] })
    useWorkflowStore.getState().updateNodeData('1', { label: 'New', extra: true })
    const node = useWorkflowStore.getState().nodes[0]
    expect(node.data.label).toBe('New')
    expect(node.data.extra).toBe(true)
  })

  it('clearWorkflow resets all state', () => {
    useWorkflowStore.setState({
      nodes: [mockNode('1')],
      edges: [{ id: 'e1', source: '1', target: '2' }],
      selectedNodeId: '1',
      isExecuting: true,
    })
    useWorkflowStore.getState().clearWorkflow()
    const state = useWorkflowStore.getState()
    expect(state.nodes).toEqual([])
    expect(state.edges).toEqual([])
    expect(state.selectedNodeId).toBeNull()
    expect(state.isExecuting).toBe(false)
  })

  describe('persisted data validation', () => {
    const STORAGE_KEY = 'pencil-agent:workflow'

    /** 重新导入 store，触发一次基于 localStorage 的初始化 */
    async function loadFreshStore() {
      vi.resetModules()
      const module = await import('../workflow-store')
      return module.useWorkflowStore
    }

    it('drops entries that are not well-formed nodes or edges', async () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 1,
          nodes: [
            { id: 'ok', type: 'agent', position: { x: 1, y: 2 }, data: {} },
            { id: 'no-position', type: 'agent', data: {} },
            null,
            'nonsense',
          ],
          edges: [
            { id: 'e-ok', source: 'ok', target: 'other' },
            { id: 42, source: 'a', target: 'b' },
          ],
        }),
      )

      const store = await loadFreshStore()
      const state = store.getState()

      expect(state.nodes.map((n) => n.id)).toEqual(['ok'])
      expect(state.edges.map((e) => e.id)).toEqual(['e-ok'])
      localStorage.clear()
    })

    it('falls back to an empty workflow when stored JSON is malformed', async () => {
      localStorage.setItem(STORAGE_KEY, '{ not json')

      const store = await loadFreshStore()

      expect(store.getState().nodes).toEqual([])
      expect(store.getState().edges).toEqual([])
      localStorage.clear()
    })
  })
})
