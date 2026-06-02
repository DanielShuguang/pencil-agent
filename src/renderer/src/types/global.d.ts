import type {
  AgentChunk,
  AgentToolCall,
  ToolDefinition,
  WorkflowDefinition,
  WorkflowProgress,
  SandboxExecuteRequest,
  SandboxOutput,
  SandboxResult,
} from '@shared/ipc'

interface AgentAPI {
  create: (config: {
    sessionId: string
    model: { id: string; provider: string }
    systemPrompt?: string
  }) => Promise<string>
  prompt: (sessionId: string, message: string) => void
  stop: (sessionId: string) => void
  onChunk: (cb: (chunk: AgentChunk) => void) => () => void
  onDone: (cb: () => void) => () => void
  onError: (cb: (error: string) => void) => () => void
}

interface WindowAPI {
  minimize: () => void
  maximize: () => void
  close: () => void
  isMaximized: () => Promise<boolean>
  onMaximizedChanged: (cb: (maximized: boolean) => void) => () => void
}

interface ToolAPI {
  list: () => Promise<ToolDefinition[]>
  get: (name: string) => Promise<ToolDefinition | undefined>
}

interface WorkflowAPI {
  execute: (workflow: WorkflowDefinition, input: Record<string, unknown>) => Promise<Record<string, unknown>>
  onProgress: (cb: (progress: WorkflowProgress) => void) => () => void
}

interface SandboxAPI {
  execute: (req: SandboxExecuteRequest) => Promise<SandboxResult>
  stop: (executionId: string) => void
  onOutput: (cb: (output: SandboxOutput) => void) => () => void
}

interface SettingsAPI {
  saveKey: (provider: string, key: string) => Promise<void>
  getKey: (provider: string) => Promise<string | null>
  deleteKey: (provider: string) => Promise<void>
}

interface ElectronAPI {
  agent: AgentAPI
  tool: ToolAPI
  window: WindowAPI
  workflow: WorkflowAPI
  sandbox: SandboxAPI
  settings: SettingsAPI
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
