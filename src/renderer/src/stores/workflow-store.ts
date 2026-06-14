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

function loadSaved(): { nodes: Node[]; edges: Edge[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      return { nodes: data.nodes ?? [], edges: data.edges ?? [] }
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }))
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
    const edges = addEdge({ ...connection, id: `edge-${Date.now()}` }, get().edges)
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
