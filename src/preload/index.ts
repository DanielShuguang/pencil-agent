import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { ThemeMode, ThemeState, AgentRole, UpdateProgress } from '@shared/ipc'

interface AgentChunk {
  type: string
  content: string
  metadata?: Record<string, unknown>
}

interface SandboxOutput {
  type: 'stdout' | 'stderr' | 'exit'
  content: string
  exitCode?: number
}

interface WorkflowProgress {
  nodeId: string
  status: string
  result?: unknown
  error?: string
}

const agentAPI = {
  create: (config: {
    sessionId: string
    model: { id: string; provider: string }
    cwd: string
    systemPrompt?: string
  }) => ipcRenderer.invoke('agent:create', config),

  prompt: (sessionId: string, message: string, model?: { id: string; provider: string }) =>
    ipcRenderer.send('agent:prompt', { sessionId, message, model }),

  stop: (sessionId: string) => ipcRenderer.send('agent:stop', sessionId),

  onChunk: (cb: (chunk: AgentChunk) => void) => {
    const handler = (_: unknown, chunk: AgentChunk) => cb(chunk)
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

interface MemoryEntryMetadata {
  sessionId: string
  role: string
  timestamp: number
  tags: string[]
}

interface SearchFilters {
  tags?: string[]
  sessionId?: string
}

interface ModelProvider {
  id: string
  name: string
  baseUrl: string
  apiKey: string
  apiFormat: 'openai' | 'anthropic'
  models: ModelConfig[]
  createdAt: number
  updatedAt: number
}

interface ModelConfig {
  id: string
  name: string
  providerId: string
  maxTokens?: number
  temperature?: number
}

interface TestConnectionRequest {
  providerId: string
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

  onOutput: (cb: (output: SandboxOutput) => void) => {
    const handler = (_: unknown, output: SandboxOutput) => cb(output)
    ipcRenderer.on('sandbox:output', handler)
    return () => ipcRenderer.removeListener('sandbox:output', handler)
  },
}

const workflowAPI = {
  execute: (
    workflow: {
      id: string
      name: string
      nodes: Array<{
        id: string
        type: string
        data: Record<string, unknown>
        position: { x: number; y: number }
      }>
      edges: Array<{
        id: string
        source: string
        target: string
        sourceHandle?: string
        targetHandle?: string
      }>
    },
    input: Record<string, unknown>,
  ): Promise<Record<string, unknown>> => ipcRenderer.invoke('workflow:execute', workflow, input),

  onProgress: (cb: (progress: WorkflowProgress) => void) => {
    const handler = (_: unknown, progress: WorkflowProgress) => cb(progress)
    ipcRenderer.on('workflow:progress', handler)
    return () => ipcRenderer.removeListener('workflow:progress', handler)
  },
}

const roleAPI = {
  list: () => ipcRenderer.invoke('role:list'),
  get: (id: string) => ipcRenderer.invoke('role:get', id),
  create: (role: Omit<AgentRole, 'createdAt' | 'updatedAt'>) =>
    ipcRenderer.invoke('role:create', role),
  update: (id: string, updates: Partial<AgentRole>) =>
    ipcRenderer.invoke('role:update', { id, updates }),
  delete: (id: string) => ipcRenderer.invoke('role:delete', id),
}

const memoryAPI = {
  store: (content: string, metadata: MemoryEntryMetadata) =>
    ipcRenderer.invoke('memory:store', { content, metadata }),
  recall: (query: string, topK?: number) => ipcRenderer.invoke('memory:recall', { query, topK }),
  search: (query: string, filters?: SearchFilters) =>
    ipcRenderer.invoke('memory:search', { query, filters }),
  delete: (id: string) => ipcRenderer.invoke('memory:delete', id),
  clearAll: () => ipcRenderer.invoke('memory:clear-all'),
}

const appAPI = {
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
}

const modelConfigAPI = {
  list: () => ipcRenderer.invoke('model-config:list'),
  save: (provider: Omit<ModelProvider, 'createdAt' | 'updatedAt'>) =>
    ipcRenderer.invoke('model-config:save', provider),
  delete: (providerId: string) => ipcRenderer.invoke('model-config:delete', providerId),
  saveModel: (providerId: string, model: ModelConfig) =>
    ipcRenderer.invoke('model-config:save-model', { providerId, model }),
  deleteModel: (providerId: string, modelId: string) =>
    ipcRenderer.invoke('model-config:delete-model', { providerId, modelId }),
  toggleVisibility: (providerId: string, modelId: string) =>
    ipcRenderer.invoke('model-config:toggle-visibility', { providerId, modelId }),
  testConnection: (request: TestConnectionRequest) =>
    ipcRenderer.invoke('model-config:test-connection', request),
  fetchModels: (providerId: string) =>
    ipcRenderer.invoke('model-config:fetch-models', { providerId }),
}

const themeAPI = {
  get: () => ipcRenderer.invoke('theme:get'),
  setMode: (mode: ThemeMode) => ipcRenderer.invoke('theme:setMode', mode),
  setTheme: (themeId: string) => ipcRenderer.invoke('theme:setTheme', themeId),
  onThemeChanged: (cb: (state: ThemeState) => void) => {
    const handler = (_: unknown, state: ThemeState) => cb(state)
    ipcRenderer.on('theme:changed', handler)
    return () => ipcRenderer.removeListener('theme:changed', handler)
  },
}

const permissionAPI = {
  getConfig: () => ipcRenderer.invoke('permission:getConfig'),
  setConfig: (config: Record<string, unknown>) => ipcRenderer.invoke('permission:setConfig', config),
  onConfirmRequest: (cb: (request: unknown) => void) => {
    const handler = (_: unknown, request: unknown) => cb(request)
    ipcRenderer.on('permission:confirm-request', handler)
    return () => ipcRenderer.removeListener('permission:confirm-request', handler)
  },
  submitConfirmResponse: (response: Record<string, unknown>) =>
    ipcRenderer.invoke('permission:confirm-response', response),
}

const auditAPI = {
  getLogs: (sessionId: string) => ipcRenderer.invoke('audit:getLogs', sessionId),
  clearLogs: () => ipcRenderer.invoke('audit:clearLogs'),
}

const updaterAPI = {
  check: () => ipcRenderer.invoke('updater:check'),
  download: () => ipcRenderer.invoke('updater:download'),
  install: () => ipcRenderer.invoke('updater:install'),
  getStatus: () => ipcRenderer.invoke('updater:getStatus'),
  onStatus: (cb: (data: { status: string }) => void) => {
    const handler = (_: unknown, data: { status: string }) => cb(data)
    ipcRenderer.on('updater:status', handler)
    return () => ipcRenderer.removeListener('updater:status', handler)
  },
  onInfo: (cb: (data: { status: string; info: object }) => void) => {
    const handler = (_: unknown, data: { status: string; info: object }) => cb(data)
    ipcRenderer.on('updater:info', handler)
    return () => ipcRenderer.removeListener('updater:info', handler)
  },
  onError: (cb: (data: { error: string }) => void) => {
    const handler = (_: unknown, data: { error: string }) => cb(data)
    ipcRenderer.on('updater:error', handler)
    return () => ipcRenderer.removeListener('updater:error', handler)
  },
  onProgress: (cb: (progress: UpdateProgress) => void) => {
    const handler = (_: unknown, progress: UpdateProgress) => cb(progress)
    ipcRenderer.on('updater:progress', handler)
    return () => ipcRenderer.removeListener('updater:progress', handler)
  },
}

const settingsAPI = {
  saveKey: (provider: string, key: string) =>
    ipcRenderer.invoke('settings:save-key', { provider, key }),

  getKey: (provider: string) => ipcRenderer.invoke('settings:get-key', { provider }),

  deleteKey: (provider: string) => ipcRenderer.invoke('settings:delete-key', { provider }),

  checkConnection: (provider: string) =>
    ipcRenderer.invoke('settings:checkConnection', { provider }),

  getMaskedKey: (provider: string) =>
    ipcRenderer.invoke('settings:get-masked-key', { provider }),
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

const dialogAPI = {
  selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
}

const systemAPI = {
  getFonts: () => ipcRenderer.invoke('system:getFonts'),
}

// Custom APIs for renderer
const api: {
  agent: typeof agentAPI
  tool: typeof toolAPI
  sandbox: typeof sandboxAPI
  workflow: typeof workflowAPI
  role: typeof roleAPI
  memory: typeof memoryAPI
  settings: typeof settingsAPI
  window: typeof windowAPI
  dialog: typeof dialogAPI
  app: typeof appAPI
  modelConfig: typeof modelConfigAPI
  theme: typeof themeAPI
  permission: typeof permissionAPI
  audit: typeof auditAPI
  updater: typeof updaterAPI
  system: typeof systemAPI
} = {
  agent: agentAPI,
  tool: toolAPI,
  sandbox: sandboxAPI,
  workflow: workflowAPI,
  role: roleAPI,
  memory: memoryAPI,
  settings: settingsAPI,
  window: windowAPI,
  dialog: dialogAPI,
  app: appAPI,
  modelConfig: modelConfigAPI,
  theme: themeAPI,
  permission: permissionAPI,
  audit: auditAPI,
  updater: updaterAPI,
  system: systemAPI,
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
