import { ElectronAPI } from '@electron-toolkit/preload'

interface AgentChunk {
  type: 'text' | 'tool_call' | 'tool_result' | 'thinking' | 'error'
  content: string
  metadata?: Record<string, unknown>
}

interface ToolDefinition {
  name: string
  description: string
  parameters: Record<string, unknown>
}

interface SandboxOutput {
  type: 'stdout' | 'stderr' | 'exit'
  content: string
  exitCode?: number
}

interface SandboxResult {
  stdout: string
  stderr: string
  exitCode: number
  executionId: string
}

interface AgentAPI {
  create: (config: {
    sessionId: string
    model: { id: string; provider: string }
    systemPrompt?: string
  }) => Promise<string>
  prompt: (sessionId: string, message: string, model?: { id: string; provider: string }) => void
  stop: (sessionId: string) => void
  onChunk: (cb: (chunk: AgentChunk) => void) => () => void
  onDone: (cb: () => void) => () => void
  onError: (cb: (error: string) => void) => () => void
}

interface ToolAPI {
  list: () => Promise<ToolDefinition[]>
  get: (name: string) => Promise<ToolDefinition | undefined>
}

interface SandboxAPI {
  execute: (req: {
    code: string
    language: 'javascript' | 'typescript' | 'python' | 'bash'
    timeout?: number
    env?: Record<string, string>
  }) => Promise<SandboxResult>
  stop: (executionId: string) => void
  onOutput: (cb: (output: SandboxOutput) => void) => () => void
}

interface WorkflowNode {
  id: string
  type: 'start' | 'end' | 'agent' | 'tool' | 'condition'
  data: Record<string, unknown>
  position: { x: number; y: number }
}

interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

interface WorkflowDefinition {
  id: string
  name: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

interface WorkflowProgress {
  nodeId: string
  status: 'pending' | 'running' | 'success' | 'error'
  result?: unknown
  error?: string
}

interface WorkflowAPI {
  execute: (
    workflow: WorkflowDefinition,
    input: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>
  onProgress: (cb: (progress: WorkflowProgress) => void) => () => void
}

interface SettingsAPI {
  saveKey: (provider: string, key: string) => Promise<void>
  getKey: (provider: string) => Promise<string | null>
  deleteKey: (provider: string) => Promise<void>
  checkConnection: (provider: string) => Promise<boolean>
}

interface AppAPI {
  getVersion: () => Promise<string>
}

interface WindowAPI {
  minimize: () => void
  maximize: () => void
  close: () => void
  isMaximized: () => Promise<boolean>
  onMaximizedChanged: (cb: (maximized: boolean) => void) => () => void
}

export interface ElectronAPIExposed {
  agent: AgentAPI
  tool: ToolAPI
  sandbox: SandboxAPI
  workflow: WorkflowAPI
  settings: SettingsAPI
  window: WindowAPI
  app: AppAPI
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: ElectronAPIExposed
  }
}
