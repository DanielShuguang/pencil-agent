import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const agentAPI = {
  create: (config: {
    sessionId: string
    model: { id: string; provider: string }
    systemPrompt?: string
  }) => ipcRenderer.invoke('agent:create', config),

  prompt: (sessionId: string, message: string) =>
    ipcRenderer.send('agent:prompt', { sessionId, message }),

  stop: (sessionId: string) => ipcRenderer.send('agent:stop', sessionId),

  onChunk: (
    cb: (chunk: { type: string; content: string; metadata?: Record<string, unknown> }) => void,
  ) => {
    const handler = (_: unknown, chunk: any) => cb(chunk)
    ipcRenderer.on('agent:chunk', handler)
    return () => ipcRenderer.removeListener('agent:chunk', handler)
  },

  onDone: (cb: () => void) => {
    const handler = () => cb()
    ipcRenderer.on('agent:done', handler)
    return () => ipcRenderer.removeListener('agent:done', handler)
  },

  onError: (cb: (error: string) => void) => {
    const handler = (_: unknown, error: string) => cb(error)
    ipcRenderer.on('agent:error', handler)
    return () => ipcRenderer.removeListener('agent:error', handler)
  },
}

const toolAPI = {
  list: () => ipcRenderer.invoke('tool:list'),
  get: (name: string) => ipcRenderer.invoke('tool:get', name),
}

const sandboxAPI = {
  execute: (req: {
    code: string
    language: 'javascript' | 'typescript' | 'python' | 'bash'
    timeout?: number
    env?: Record<string, string>
  }) => ipcRenderer.invoke('sandbox:execute', req),

  stop: (executionId: string) => ipcRenderer.send('sandbox:stop', executionId),

  onOutput: (cb: (output: { type: 'stdout' | 'stderr' | 'exit'; content: string; exitCode?: number }) => void) => {
    const handler = (_: unknown, output: any) => cb(output)
    ipcRenderer.on('sandbox:output', handler)
    return () => ipcRenderer.removeListener('sandbox:output', handler)
  },
}

const workflowAPI = {
  execute: (workflow: {
    id: string
    name: string
    nodes: Array<{ id: string; type: string; data: Record<string, unknown>; position: { x: number; y: number } }>
    edges: Array<{ id: string; source: string; target: string; sourceHandle?: string; targetHandle?: string }>
  }, input: Record<string, unknown>) => ipcRenderer.invoke('workflow:execute', workflow, input),

  onProgress: (cb: (progress: { nodeId: string; status: string; result?: unknown; error?: string }) => void) => {
    const handler = (_: unknown, progress: any) => cb(progress)
    ipcRenderer.on('workflow:progress', handler)
    return () => ipcRenderer.removeListener('workflow:progress', handler)
  },
}

const windowAPI = {
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  onMaximizedChanged: (cb: (maximized: boolean) => void) => {
    const handler = (_: unknown, maximized: boolean) => cb(maximized)
    ipcRenderer.on('window:maximized-changed', handler)
    return () => ipcRenderer.removeListener('window:maximized-changed', handler)
  },
}

// Custom APIs for renderer
const api = {
  agent: agentAPI,
  tool: toolAPI,
  sandbox: sandboxAPI,
  workflow: workflowAPI,
  window: windowAPI,
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
