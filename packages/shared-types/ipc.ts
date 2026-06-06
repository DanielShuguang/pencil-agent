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

// 状态栏相关
export interface TokenUsage {
  prompt: number
  completion: number
  total: number
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'checking'

// App API
export interface AppAPI {
  getVersion: () => Promise<string>
}

// Settings API 扩展
export interface CheckConnectionRequest {
  provider: string
}

// 主题相关
export type ThemeMode = 'light' | 'dark' | 'system'

export interface ThemeColors {
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  destructive: string
  destructiveForeground: string
  border: string
  input: string
  ring: string
}

export interface Theme {
  id: string
  name: string
  colors: ThemeColors
}

export interface ThemeState {
  mode: ThemeMode
  currentThemeId: string
  isDark: boolean
}

// 模型配置相关
export type ApiFormat = 'openai' | 'anthropic'

export interface ModelProvider {
  id: string
  name: string
  baseUrl: string
  apiKey: string
  apiFormat: ApiFormat
  models: ModelConfig[]
  createdAt: number
  updatedAt: number
}

export interface ModelConfig {
  id: string
  name: string
  providerId: string
  visible?: boolean
  maxTokens?: number
  temperature?: number
}

export interface TestConnectionRequest {
  providerId: string
}

export interface TestConnectionResponse {
  success: boolean
  error?: string
}

export type ModelProviderInfo = Omit<ModelProvider, 'apiKey'>

export interface ModelConfigAPI {
  list: () => Promise<ModelProviderInfo[]>
  save: (provider: Omit<ModelProvider, 'createdAt' | 'updatedAt'>) => Promise<ModelProvider>
  delete: (providerId: string) => Promise<void>
  saveModel: (providerId: string, model: ModelConfig) => Promise<void>
  deleteModel: (providerId: string, modelId: string) => Promise<void>
  toggleVisibility: (providerId: string, modelId: string) => Promise<void>
  testConnection: (request: TestConnectionRequest) => Promise<TestConnectionResponse>
  fetchModels: (providerId: string) => Promise<{ models: ModelConfig[]; error?: string }>
}

// 主题 API
export interface ThemeAPI {
  get: () => Promise<ThemeState>
  setMode: (mode: ThemeMode) => Promise<void>
  setTheme: (themeId: string) => Promise<void>
  onThemeChanged: (callback: (state: ThemeState) => void) => () => void
}

// 更新相关
export interface UpdateInfo {
  version: string
  releaseDate: string
  releaseNotes?: string
}

export interface UpdateProgress {
  bytesPerSecond: number
  percent: number
  transferred: number
  total: number
}

export interface UpdateStatus {
  isChecking: boolean
  isDownloading: boolean
}

// 更新 API
export interface UpdaterAPI {
  check: () => Promise<{ status: string; result?: object; error?: string }>
  download: () => Promise<{ status: string; error?: string }>
  install: () => Promise<void>
  getStatus: () => Promise<UpdateStatus>
  onStatus: (callback: (data: { status: string }) => void) => () => void
  onInfo: (callback: (data: { status: string; info: object }) => void) => () => void
  onError: (callback: (data: { error: string }) => void) => () => void
  onProgress: (callback: (progress: UpdateProgress) => void) => () => void
}
