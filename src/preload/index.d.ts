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
  prompt: (sessionId: string, message: string) => void
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

interface WindowAPI {
  minimize: () => void
  maximize: () => void
  close: () => void
  isMaximized: () => Promise<boolean>
  onMaximizedChanged: (cb: (maximized: boolean) => void) => () => void
}

interface ElectronAPIExposed {
  agent: AgentAPI
  tool: ToolAPI
  sandbox: SandboxAPI
  window: WindowAPI
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: ElectronAPIExposed
  }
}
