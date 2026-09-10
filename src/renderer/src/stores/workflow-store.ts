import { create } from 'zustand'
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react'
import type { WorkflowProgress } from '@shared/ipc'

const STORAGE_KEY = 'pencil-agent:workflow'
const STORAGE_VERSION = 1

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function sanitizeNodes(value: unknown): Node[] {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is Node => {
    if (!isRecord(entry)) return false
    const position = entry.position
    return (
      typeof entry.id === 'string' &&
      typeof entry.type === 'string' &&
      isRecord(position) &&
      typeof position.x === 'number' &&
      typeof position.y === 'number'
    )
  })
}

function sanitizeEdges(value: unknown): Edge[] {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is Edge => {
    if (!isRecord(entry)) return false
    return (
      typeof entry.id === 'string' &&
      typeof entry.source === 'string' &&
      typeof entry.target === 'string'
    )
  })
}

function loadSaved(): { nodes: Node[]; edges: Edge[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data: unknown = JSON.parse(raw)
      if (!isRecord(data)) return { nodes: [], edges: [] }
      // 数据来自 localStorage（可被外部写入），进入引擎前必须做结构校验，
      // 否则损坏的节点会让引擎在读字段时抛错
      return { nodes: sanitizeNodes(data.nodes), edges: sanitizeEdges(data.edges) }
    }
  } catch { /* ignore */ }
  return { nodes: [], edges: [] }
}

interface WorkflowState {
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string | null
  nodeStatus: Map<string, 'pending' | 'running' | 'success' | 'error'>
  isExecuting: boolean

  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  addNode: (node: Node) => void
  removeNode: (nodeId: string) => void
  selectNode: (nodeId: string | null) => void
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void
  setExecuting: (isExecuting: boolean) => void
  updateNodeStatus: (progress: WorkflowProgress) => void
  clearWorkflow: () => void
}

function persist(nodes: Node[], edges: Edge[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, nodes, edges }))
  } catch { /* ignore */ }
}

const saved = loadSaved()

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: saved.nodes,
  edges: saved.edges,
  selectedNodeId: null,
  nodeStatus: new Map(),
  isExecuting: false,

  setNodes: (nodes) => {
    set({ nodes })
    persist(nodes, get().edges)
  },
  setEdges: (edges) => {
    set({ edges })
    persist(get().nodes, edges)
  },

  onNodesChange: (changes) => {
    const nodes = applyNodeChanges(changes, get().nodes)
    set({ nodes })
    persist(nodes, get().edges)
  },

  onEdgesChange: (changes) => {
    const edges = applyEdgeChanges(changes, get().edges)
    set({ edges })
    persist(get().nodes, edges)
  },

  onConnect: (connection) => {
    const edgeId = `edge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const edges = addEdge({ ...connection, id: edgeId }, get().edges)
    set({ edges })
    persist(get().nodes, edges)
  },

  addNode: (node) => {
    const nodes = [...get().nodes, node]
    set({ nodes })
    persist(nodes, get().edges)
  },

  removeNode: (nodeId) => {
    const { nodes, edges, selectedNodeId } = get()
    const newNodes = nodes.filter((n) => n.id !== nodeId)
    const newEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId)
    set({
      nodes: newNodes,
      edges: newEdges,
      selectedNodeId: selectedNodeId === nodeId ? null : selectedNodeId,
    })
    persist(newNodes, newEdges)
  },

  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId })
  },

  updateNodeData: (nodeId, data) => {
    const { nodes } = get()
    const newNodes = nodes.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n))
    set({ nodes: newNodes })
    persist(newNodes, get().edges)
  },

  setExecuting: (isExecuting) => set({ isExecuting }),

  updateNodeStatus: (progress) => {
    const { nodeStatus } = get()
    const newStatus = new Map(nodeStatus)
    newStatus.set(progress.nodeId, progress.status)
    set({ nodeStatus: newStatus })
  },

  clearWorkflow: () => {
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      nodeStatus: new Map(),
      isExecuting: false,
    })
    localStorage.removeItem(STORAGE_KEY)
  },
}))
