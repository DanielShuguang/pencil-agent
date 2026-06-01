import type {
  AgentCreateRequest,
  AgentChunk,
  AgentToolCall,
  WorkflowDefinition,
  WorkflowProgress,
  SandboxExecuteRequest,
  SandboxOutput
} from '@shared/ipc'

interface AgentAPI {
  create: (config: AgentCreateRequest) => Promise<string>
  prompt: (sessionId: string, message: string) => void
  stop: (sessionId: string) => void
  onChunk: (cb: (chunk: AgentChunk) => void) => () => void
  onToolCall: (cb: (call: AgentToolCall) => void) => () => void
  onDone: (cb: () => void) => () => void
  onError: (cb: (error: string) => void) => () => void
}

interface WorkflowAPI {
  create: (def: WorkflowDefinition) => Promise<string>
  execute: (id: string, input: Record<string, unknown>) => Promise<void>
  onProgress: (cb: (progress: WorkflowProgress) => void) => () => void
}

interface SandboxAPI {
  execute: (req: SandboxExecuteRequest) => Promise<void>
  onOutput: (cb: (output: SandboxOutput) => void) => () => void
}

interface ElectronAPI {
  agent: AgentAPI
  workflow: WorkflowAPI
  sandbox: SandboxAPI
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
