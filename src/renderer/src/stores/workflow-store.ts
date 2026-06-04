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

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  nodeStatus: new Map(),
  isExecuting: false,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) })
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) })
  },

  onConnect: (connection) => {
    set({ edges: addEdge({ ...connection, id: `edge-${Date.now()}` }, get().edges) })
  },

  addNode: (node) => {
    set({ nodes: [...get().nodes, node] })
  },

  removeNode: (nodeId) => {
    const { nodes, edges, selectedNodeId } = get()
    set({
      nodes: nodes.filter((n) => n.id !== nodeId),
      edges: edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: selectedNodeId === nodeId ? null : selectedNodeId,
    })
  },

  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId })
  },

  updateNodeData: (nodeId, data) => {
    const { nodes } = get()
    set({
      nodes: nodes.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n)),
    })
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
  },
}))
