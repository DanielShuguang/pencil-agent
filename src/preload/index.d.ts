import { ElectronAPI } from '@electron-toolkit/preload'

interface AgentChunk {
  type: 'text' | 'tool_call' | 'tool_result' | 'thinking' | 'error'
  content: string
  metadata?: Record<string, unknown>
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

interface WindowAPI {
  minimize: () => void
  maximize: () => void
  close: () => void
  isMaximized: () => Promise<boolean>
  onMaximizedChanged: (cb: (maximized: boolean) => void) => () => void
}

interface ElectronAPIExposed {
  agent: AgentAPI
  window: WindowAPI
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: ElectronAPIExposed
  }
}
