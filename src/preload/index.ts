import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

interface ElectronAPIExposed {
  agent: any
  tool: any
  sandbox: any
  workflow: any
  role: any
  memory: any
  settings: any
  window: any
  app: any
  modelConfig: any
  theme: any
}

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
  }, input: Record<string, unknown>): Promise<Record<string, unknown>> => ipcRenderer.invoke('workflow:execute', workflow, input),

  onProgress: (cb: (progress: { nodeId: string; status: string; result?: unknown; error?: string }) => void) => {
    const handler = (_: unknown, progress: any) => cb(progress)
    ipcRenderer.on('workflow:progress', handler)
    return () => ipcRenderer.removeListener('workflow:progress', handler)
  },
}

const roleAPI = {
  list: () => ipcRenderer.invoke('role:list'),
  get: (id: string) => ipcRenderer.invoke('role:get', id),
  create: (role: any) => ipcRenderer.invoke('role:create', role),
  update: (id: string, updates: any) => ipcRenderer.invoke('role:update', { id, updates }),
  delete: (id: string) => ipcRenderer.invoke('role:delete', id),
}

const memoryAPI = {
  store: (content: string, metadata: any) =>
    ipcRenderer.invoke('memory:store', { content, metadata }),
  recall: (query: string, topK?: number) =>
    ipcRenderer.invoke('memory:recall', { query, topK }),
  search: (query: string, filters?: any) =>
    ipcRenderer.invoke('memory:search', { query, filters }),
  delete: (id: string) =>
    ipcRenderer.invoke('memory:delete', id),
  clearAll: () =>
    ipcRenderer.invoke('memory:clear-all'),
}

const appAPI = {
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
}

const modelConfigAPI = {
  list: () => ipcRenderer.invoke('model-config:list'),
  save: (provider: any) => ipcRenderer.invoke('model-config:save', provider),
  delete: (providerId: string) => ipcRenderer.invoke('model-config:delete', providerId),
  saveModel: (providerId: string, model: any) => ipcRenderer.invoke('model-config:save-model', { providerId, model }),
  deleteModel: (providerId: string, modelId: string) => ipcRenderer.invoke('model-config:delete-model', { providerId, modelId }),
  testConnection: (request: any) => ipcRenderer.invoke('model-config:test-connection', request),
}

const themeAPI = {
  get: () => ipcRenderer.invoke('theme:get'),
  setMode: (mode: string) => ipcRenderer.invoke('theme:setMode', mode),
  setTheme: (themeId: string) => ipcRenderer.invoke('theme:setTheme', themeId),
  onThemeChanged: (cb: (state: any) => void) => {
    const handler = (_: unknown, state: any) => cb(state)
    ipcRenderer.on('theme:changed', handler)
    return () => ipcRenderer.removeListener('theme:changed', handler)
  },
}

const settingsAPI = {
  saveKey: (provider: string, key: string) =>
    ipcRenderer.invoke('settings:save-key', { provider, key }),

  getKey: (provider: string) =>
    ipcRenderer.invoke('settings:get-key', { provider }),

  deleteKey: (provider: string) =>
    ipcRenderer.invoke('settings:delete-key', { provider }),

  checkConnection: (provider: string) =>
    ipcRenderer.invoke('settings:checkConnection', { provider }),
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
const api: ElectronAPIExposed = {
  agent: agentAPI,
  tool: toolAPI,
  sandbox: sandboxAPI,
  workflow: workflowAPI,
  role: roleAPI,
  memory: memoryAPI,
  settings: settingsAPI,
  window: windowAPI,
  app: appAPI,
  modelConfig: modelConfigAPI,
  theme: themeAPI,
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
