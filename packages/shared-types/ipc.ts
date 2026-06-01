// Agent 相关
export interface AgentCreateRequest {
  sessionId: string
  model: { id: string; provider: string }
  systemPrompt?: string
}

export interface AgentChunk {
  type: 'text' | 'tool_call' | 'tool_result' | 'thinking' | 'error'
  content: string
  metadata?: Record<string, unknown>
}

export interface AgentToolCall {
  toolName: string
  parameters: Record<string, unknown>
  status: 'pending' | 'running' | 'success' | 'error'
  result?: unknown
}

// 工作流相关
export interface WorkflowDefinition {
  id: string
  name: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

export interface WorkflowNode {
  id: string
  type: 'agent' | 'tool' | 'condition' | 'start' | 'end'
  data: Record<string, unknown>
  position: { x: number; y: number }
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  condition?: string
}

export interface WorkflowProgress {
  nodeId: string
  status: 'pending' | 'running' | 'success' | 'error'
  result?: unknown
  error?: string
}

// 沙箱相关
export interface SandboxExecuteRequest {
  code: string
  language: 'javascript' | 'typescript' | 'python' | 'bash'
  timeout?: number
  env?: Record<string, string>
}

export interface SandboxOutput {
  type: 'stdout' | 'stderr' | 'exit'
  content: string
  exitCode?: number
}
