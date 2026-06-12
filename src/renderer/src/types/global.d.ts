import type {
  ModelProvider,
  ModelProviderInfo,
  ModelConfig,
  TestConnectionRequest,
  TestConnectionResponse,
  UpdateProgress,
  ThemeMode,
  ThemeState,
} from '@shared/ipc'

interface AgentAPI {
  create: (config: {
    sessionId: string
    model: { id: string; provider: string }
    cwd: string
    systemPrompt?: string
  }) => Promise<string>
  prompt: (sessionId: string, message: string, model?: { id: string; provider: string }) => void
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
  execute: (
    workflow: WorkflowDefinition,
    input: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>
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
  checkConnection: (provider: string) => Promise<boolean>
  getMaskedKey: (provider: string) => Promise<string | null>
}

interface AppAPI {
  getVersion: () => Promise<string>
}

interface ModelConfigAPI {
  list: () => Promise<ModelProviderInfo[]>
  save: (provider: Omit<ModelProvider, 'createdAt' | 'updatedAt'>) => Promise<ModelProvider>
  delete: (providerId: string) => Promise<void>
  saveModel: (providerId: string, model: ModelConfig) => Promise<void>
  deleteModel: (providerId: string, modelId: string) => Promise<void>
  toggleVisibility: (providerId: string, modelId: string) => Promise<void>
  testConnection: (request: TestConnectionRequest) => Promise<TestConnectionResponse>
  fetchModels: (providerId: string) => Promise<{ models: ModelConfig[]; error?: string }>
}

interface ThemeAPI {
  get: () => Promise<ThemeState>
  setMode: (mode: ThemeMode) => Promise<void>
  setTheme: (themeId: string) => Promise<void>
  onThemeChanged: (callback: (state: ThemeState) => void) => () => void
}

interface UpdaterAPI {
  check: () => Promise<{ status: string; result?: object; error?: string }>
  download: () => Promise<{ status: string; error?: string }>
  install: () => Promise<void>
  getStatus: () => Promise<{ isChecking: boolean; isDownloading: boolean }>
  onStatus: (callback: (data: { status: string }) => void) => () => void
  onInfo: (callback: (data: { status: string; info: object }) => void) => () => void
  onError: (callback: (data: { error: string }) => void) => () => void
  onProgress: (callback: (progress: UpdateProgress) => void) => () => void
}

interface RoleAPI {
  list: () => Promise<AgentRole[]>
  get: (id: string) => Promise<AgentRole | undefined>
  create: (role: Omit<AgentRole, 'createdAt' | 'updatedAt'>) => Promise<AgentRole>
  update: (id: string, updates: Partial<AgentRole>) => Promise<AgentRole | undefined>
  delete: (id: string) => Promise<boolean>
}

interface MemoryAPI {
  store: (content: string, metadata: MemoryEntry['metadata']) => Promise<string>
  recall: (query: string, topK?: number) => Promise<MemoryEntry[]>
  search: (
    query: string,
    filters?: { tags?: string[]; sessionId?: string },
  ) => Promise<MemoryEntry[]>
  delete: (id: string) => Promise<void>
  clearAll: () => Promise<void>
}

interface PermissionAPI {
  getConfig: () => Promise<{ mode: string; disabledTools: string[]; dangerousPatternOverrides: string[] }>
  setConfig: (config: Record<string, unknown>) => Promise<void>
  onConfirmRequest: (cb: (request: unknown) => void) => () => void
  submitConfirmResponse: (response: Record<string, unknown>) => Promise<void>
}

interface AuditAPI {
  getLogs: (sessionId: string) => Promise<unknown[]>
  clearLogs: () => Promise<void>
}

interface DialogAPI {
  selectDirectory: () => Promise<{ canceled: boolean; filePaths: string[] }>
}

interface ElectronAPI {
  agent: AgentAPI
  tool: ToolAPI
  role: RoleAPI
  memory: MemoryAPI
  window: WindowAPI
  dialog: DialogAPI
  workflow: WorkflowAPI
  sandbox: SandboxAPI
  settings: SettingsAPI
  app: AppAPI
  modelConfig: ModelConfigAPI
  theme: ThemeAPI
  permission: PermissionAPI
  audit: AuditAPI
  updater: UpdaterAPI
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
