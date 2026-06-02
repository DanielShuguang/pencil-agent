// 工具相关
export interface ToolDefinition {
  name: string
  description: string
  parameters: Record<string, unknown> // JSON Schema
}

export interface ToolCallRequest {
  toolName: string
  parameters: Record<string, unknown>
}

export interface ToolCallResult {
  toolName: string
  status: 'success' | 'error'
  result?: unknown
  error?: string
}

// Agent 相关
export interface AgentCreateRequest {
  sessionId: string
  model: { id: string; provider: string }
  systemPrompt?: string
  tools?: string[] // 可用工具名称列表
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
  error?: string
}

// 工作流相关
export type NodeType = 'start' | 'end' | 'agent' | 'tool' | 'condition' | 'multi-agent'

export interface PortDefinition {
  id: string
  name: string
  type: 'string' | 'object' | 'array' | 'any'
  required: boolean
}

export interface NodeDefinition {
  type: NodeType
  label: string
  icon: string
  inputs: PortDefinition[]
  outputs: PortDefinition[]
  configSchema: Record<string, unknown> // JSON Schema
}

export const NODE_REGISTRY: Record<NodeType, NodeDefinition> = {
  start: {
    type: 'start',
    label: '开始',
    icon: 'Play',
    inputs: [],
    outputs: [{ id: 'output', name: '输出', type: 'any', required: true }],
    configSchema: { type: 'object', properties: { input: { type: 'object' } } },
  },
  end: {
    type: 'end',
    label: '结束',
    icon: 'Square',
    inputs: [{ id: 'input', name: '输入', type: 'any', required: true }],
    outputs: [],
    configSchema: { type: 'object', properties: {} },
  },
  agent: {
    type: 'agent',
    label: 'Agent',
    icon: 'Bot',
    inputs: [{ id: 'input', name: '输入', type: 'string', required: true }],
    outputs: [
      { id: 'output', name: '输出', type: 'string', required: true },
      { id: 'tool_calls', name: '工具调用', type: 'array', required: false },
    ],
    configSchema: {
      type: 'object',
      properties: {
        model: { type: 'object', properties: { id: { type: 'string' }, provider: { type: 'string' } } },
        systemPrompt: { type: 'string' },
        maxTokens: { type: 'number' },
        temperature: { type: 'number' },
      },
    },
  },
  tool: {
    type: 'tool',
    label: '工具',
    icon: 'Wrench',
    inputs: [{ id: 'input', name: '输入', type: 'any', required: true }],
    outputs: [{ id: 'output', name: '输出', type: 'any', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        toolName: { type: 'string' },
        parameters: { type: 'object' },
      },
    },
  },
  condition: {
    type: 'condition',
    label: '条件',
    icon: 'GitBranch',
    inputs: [{ id: 'input', name: '输入', type: 'any', required: true }],
    outputs: [
      { id: 'true', name: 'True', type: 'any', required: true },
      { id: 'false', name: 'False', type: 'any', required: true },
    ],
    configSchema: {
      type: 'object',
      properties: {
        expression: { type: 'string' },
      },
    },
  },
  'multi-agent': {
    type: 'multi-agent',
    label: '多Agent',
    icon: 'Users',
    inputs: [{ id: 'input', name: '输入', type: 'string', required: true }],
    outputs: [{ id: 'output', name: '输出', type: 'string', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['sequential', 'parallel', 'debate', 'hierarchical'] },
        roleIds: { type: 'array', items: { type: 'string' } },
        maxRounds: { type: 'number' },
        mergerRoleId: { type: 'string' },
      },
    },
  },
}

export interface WorkflowDefinition {
  id: string
  name: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

export interface WorkflowNode {
  id: string
  type: NodeType
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

export interface SandboxResult {
  stdout: string
  stderr: string
  exitCode: number
  executionId: string
}

// 设置相关
export interface SaveKeyRequest {
  provider: string
  key: string
}

export interface GetKeyRequest {
  provider: string
}

export interface ModelInfo {
  id: string
  name: string
  provider: string
}

// 角色相关
export interface AgentRole {
  id: string
  name: string
  description: string
  systemPrompt: string
  model: { id: string; provider: string }
  tools: string[]
  createdAt: number
  updatedAt: number
}

// 多 Agent 编排相关
export type OrchestrationMode = 'sequential' | 'parallel' | 'debate' | 'hierarchical'

export interface OrchestrationConfig {
  mode: OrchestrationMode
  roles: string[] // Role IDs
  maxRounds?: number // For debate mode
  mergerRoleId?: string // For parallel mode
}

// 记忆相关
export interface MemoryEntry {
  id: string
  content: string
  metadata: {
    sessionId: string
    role: string
    timestamp: number
    tags: string[]
  }
  score?: number
}
