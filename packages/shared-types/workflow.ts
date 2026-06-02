export type { NodeType, NodeDefinition, PortDefinition, WorkflowDefinition, WorkflowNode, WorkflowEdge, WorkflowProgress } from './ipc'
export { NODE_REGISTRY } from './ipc'

export interface WorkflowConfig {
  model?: { id: string; provider: string }
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  toolName?: string
  parameters?: Record<string, unknown>
  expression?: string
}

export interface ExecutionContext {
  workflowId: string
  nodeOutputs: Map<string, unknown>
  variables: Map<string, unknown>
  status: Map<string, 'pending' | 'running' | 'success' | 'error'>
}
