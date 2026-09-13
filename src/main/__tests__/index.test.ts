import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  // electron app
  whenReady: vi.fn(),
  on: vi.fn(),
  quit: vi.fn(),
  getVersion: vi.fn(() => '9.9.9'),
  // electron window
  windows: [] as any[],
  getAllWindows: vi.fn(() => mocks.windows),
  openExternal: vi.fn(),
  // ipc
  ipcOn: vi.fn(),
  ipcHandle: vi.fn(),
  // safeStorage
  isEncryptionAvailable: vi.fn(() => true),
  decryptString: vi.fn((buf: Buffer) => buf.toString().replace('encrypted:', '')),
  // toolkit
  setAppUserModelId: vi.fn(),
  watchWindowShortcuts: vi.fn(),
  isDev: false,
  readyCallback: null as (() => Promise<void>) | null,
  // collaborators
  modelConfigGetApiKey: vi.fn(),
  modelConfigReload: vi.fn(),
  agentAddExtension: vi.fn(),
  agentDestroyAll: vi.fn(),
  agentGetSessionCwd: vi.fn(() => null),
  appStoreGet: vi.fn(),
  createSandboxExecutor: vi.fn(),
  createToolRegistry: vi.fn(() => ({ name: 'tool-registry' })),
  registerAgentHandlers: vi.fn(),
  registerSandboxHandlers: vi.fn(),
  registerWorkflowHandlers: vi.fn(),
  registerMemoryHandlers: vi.fn(),
  createPermissionExtension: vi.fn(() => 'permission-extension'),
  auditCleanup: vi.fn(),
  workEngineCtor: vi.fn(),
  updaterCtor: vi.fn(),
}))

class MockBrowserWindow {
  static getAllWindows = mocks.getAllWindows

  options: any
  webContents = { send: vi.fn(), setWindowOpenHandler: vi.fn() }
  listeners = new Map<string, Function>()
  show = vi.fn()
  minimize = vi.fn()
  maximize = vi.fn()
  unmaximize = vi.fn()
  close = vi.fn()
  isMaximizedResult = false
  loadURL = vi.fn()
  loadFile = vi.fn()

  constructor(options: any) {
    this.options = options
    mocks.windows.push(this)
  }

  on(event: string, handler: Function) {
    this.listeners.set(event, handler)
    return this
  }

  isMaximized() {
    return this.isMaximizedResult
  }

  emit(event: string) {
    this.listeners.get(event)?.()
  }
}

vi.mock('electron', () => ({
  app: {
    whenReady: mocks.whenReady,
    on: mocks.on,
    quit: mocks.quit,
    getVersion: mocks.getVersion,
  },
  shell: { openExternal: mocks.openExternal },
  BrowserWindow: MockBrowserWindow,
  ipcMain: { on: mocks.ipcOn, handle: mocks.ipcHandle },
  safeStorage: {
    isEncryptionAvailable: mocks.isEncryptionAvailable,
    decryptString: mocks.decryptString,
  },
}))

vi.mock('@electron-toolkit/utils', () => ({
  electronApp: { setAppUserModelId: mocks.setAppUserModelId },
  optimizer: { watchWindowShortcuts: mocks.watchWindowShortcuts },
  is: {
    get dev() {
      return mocks.isDev
    },
  },
}))

vi.mock('../../resources/icon.png?asset', () => ({ default: 'icon.png' }))

vi.mock('../agent/model-config', () => ({
  ModelConfigManager: function () {
    return { getApiKey: mocks.modelConfigGetApiKey, reload: mocks.modelConfigReload }
  },
}))

vi.mock('../agent/permission-manager', () => ({
  PermissionManager: function () {
    return {}
  },
}))

vi.mock('../agent/audit-logger', () => ({
  AuditLogger: function () {
    return { cleanup: mocks.auditCleanup }
  },
}))

vi.mock('../agent/permission-extension', () => ({
  createPermissionExtension: mocks.createPermissionExtension,
}))

vi.mock('../agent/session-manager', () => ({
  AgentSessionManager: function (getApiKey: (provider: string) => string | null) {
    ;(globalThis as any).__getApiKey = getApiKey
    return {
      addExtension: mocks.agentAddExtension,
      destroyAll: mocks.agentDestroyAll,
      getSessionCwd: mocks.agentGetSessionCwd,
    }
  },
}))

vi.mock('../agent/tool-registry', () => ({
  createToolRegistry: mocks.createToolRegistry,
}))

vi.mock('../agent/ipc-handlers', () => ({
  registerAgentHandlers: mocks.registerAgentHandlers,
}))

vi.mock('../sandbox/factory', () => ({
  createSandboxExecutor: mocks.createSandboxExecutor,
}))

vi.mock('../sandbox/ipc-handlers', () => ({
  registerSandboxHandlers: mocks.registerSandboxHandlers,
}))

vi.mock('../workflow/ipc-handlers', () => ({
  registerWorkflowHandlers: mocks.registerWorkflowHandlers,
}))

vi.mock('../workflow/engine', () => ({
  WorkflowEngine: function () {
    mocks.workEngineCtor()
    return {}
  },
}))

vi.mock('../memory/ipc-handlers', () => ({
  registerMemoryHandlers: mocks.registerMemoryHandlers,
}))

vi.mock('../updater', () => ({
  Updater: function () {
    mocks.updaterCtor()
    return {}
  },
}))

vi.mock('../lib/store', () => ({
  appStore: { get: mocks.appStoreGet },
}))

async function bootApp() {
  mocks.createSandboxExecutor.mockResolvedValue({ name: 'sandbox' })
  // whenReady 返回真实 Promise，随后通过捕获的回调手动执行启动逻辑
  // 用一个“受控 thenable”捕获启动回调，测试里手动触发
  mocks.whenReady.mockImplementation(() => ({
    // oxlint-disable-next-line unicorn/no-thenable
    then: (cb: () => Promise<void>) => {
      mocks.readyCallback = cb
      return Promise.resolve()
    },
  }))
  // 每次重新加载模块，确保模块级初始化逻辑再次执行
  vi.resetModules()
  await import('../index')
  await vi.waitFor(() => expect(mocks.readyCallback).toBeTruthy())
  await mocks.readyCallback?.()
  await vi.waitFor(() => expect(mocks.windows.length).toBeGreaterThan(0))
}

describe('main/index 启动引导', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.windows.length = 0
    mocks.getAllWindows.mockImplementation(() => mocks.windows)
    mocks.agentGetSessionCwd.mockReturnValue(null)
    mocks.isEncryptionAvailable.mockReturnValue(true)
    mocks.isDev = false
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('启动时初始化沙箱、工作流引擎并创建窗口', async () => {
    await bootApp()

    expect(mocks.modelConfigReload).toHaveBeenCalled()
    expect(mocks.setAppUserModelId).toHaveBeenCalledWith('com.electron')
    expect(mocks.createSandboxExecutor).toHaveBeenCalled()
    expect(mocks.workEngineCtor).toHaveBeenCalled()
    expect(mocks.windows).toHaveLength(1)
  })

  it('窗口使用安全配置并加载本地入口', async () => {
    await bootApp()
    const window = mocks.windows[0]

    expect(window.options).toMatchObject({
      width: 1024,
      height: 768,
      minWidth: 1024,
      minHeight: 768,
      show: false,
      frame: false,
      webPreferences: expect.objectContaining({ sandbox: false }),
    })
    expect(window.options.webPreferences.preload).toContain('preload')
    expect(window.loadFile).toHaveBeenCalled()
  })

  it('注册各模块的 IPC handler 并清理过期审计日志', async () => {
    await bootApp()

    expect(mocks.registerAgentHandlers).toHaveBeenCalled()
    expect(mocks.registerSandboxHandlers).toHaveBeenCalled()
    expect(mocks.registerWorkflowHandlers).toHaveBeenCalled()
    expect(mocks.registerMemoryHandlers).toHaveBeenCalled()
    expect(mocks.auditCleanup).toHaveBeenCalled()
    expect(mocks.agentAddExtension).toHaveBeenCalledWith('permission-extension')
    expect(mocks.updaterCtor).toHaveBeenCalled()
  })

  it('ready-to-show 后才显示窗口', async () => {
    await bootApp()
    const window = mocks.windows[0]

    expect(window.show).not.toHaveBeenCalled()
    window.emit('ready-to-show')
    expect(window.show).toHaveBeenCalled()
  })

  it('外部链接通过 shell 打开并阻止新窗口', async () => {
    await bootApp()
    const window = mocks.windows[0]
    const handler = window.webContents.setWindowOpenHandler.mock.calls[0][0]

    const result = handler({ url: 'https://example.com' })

    expect(mocks.openExternal).toHaveBeenCalledWith('https://example.com')
    expect(result).toEqual({ action: 'deny' })
  })

  it('窗口最小化/最大化/关闭 IPC 生效', async () => {
    await bootApp()
    const window = mocks.windows[0]
    const handlers = new Map<string, Function>(
      mocks.ipcOn.mock.calls.map((call) => [call[0], call[1]] as const),
    )

    handlers.get('window:minimize')?.()
    expect(window.minimize).toHaveBeenCalled()

    window.isMaximizedResult = true
    handlers.get('window:maximize')?.()
    expect(window.unmaximize).toHaveBeenCalled()

    window.isMaximizedResult = false
    handlers.get('window:maximize')?.()
    expect(window.maximize).toHaveBeenCalled()

    handlers.get('window:close')?.()
    expect(window.close).toHaveBeenCalled()
  })

  it('最大化状态变化会广播给渲染进程', async () => {
    await bootApp()
    const window = mocks.windows[0]

    window.emit('maximize')
    expect(window.webContents.send).toHaveBeenCalledWith('window:maximized-changed', true)

    window.emit('unmaximize')
    expect(window.webContents.send).toHaveBeenCalledWith('window:maximized-changed', false)
  })

  it('isMaximized 查询与版本查询返回真实值', async () => {
    await bootApp()
    const window = mocks.windows[0]
    window.isMaximizedResult = true

    const registered = mocks.ipcHandle.mock.calls.map((call) => [call[0], call[1]] as const)
    const isMaximizedHandler = registered.find(([channel]) => channel === 'window:isMaximized')?.[1]
    const versionHandler = registered.find(([channel]) => channel === 'app:getVersion')?.[1]

    expect(isMaximizedHandler?.()).toBe(true)
    expect(versionHandler?.()).toBe('9.9.9')
  })

  it('所有窗口关闭时非 macOS 退出应用', async () => {
    await bootApp()
    const handler = mocks.on.mock.calls.find((call) => call[0] === 'window-all-closed')?.[1]

    handler?.()

    expect(mocks.quit).toHaveBeenCalled()
  })

  it('退出前销毁全部 agent 会话', async () => {
    await bootApp()
    const handler = mocks.on.mock.calls.find((call) => call[0] === 'before-quit')?.[1]

    handler?.()

    expect(mocks.agentDestroyAll).toHaveBeenCalled()
  })

  it('activate 时在没有窗口的情况下重建窗口', async () => {
    await bootApp()
    const handler = mocks.on.mock.calls.find((call) => call[0] === 'activate')?.[1]
    expect(handler).toBeDefined()

    mocks.getAllWindows.mockReturnValue([])
    handler?.()

    expect(mocks.windows.length).toBe(2)
  })

  it('API key 解析优先使用 ModelConfigManager', async () => {
    await bootApp()
    const getApiKey = (globalThis as any).__getApiKey as (provider: string) => string | null
    mocks.modelConfigGetApiKey.mockReturnValue('sk-from-config')

    expect(getApiKey('openai')).toBe('sk-from-config')
    expect(mocks.appStoreGet).not.toHaveBeenCalled()
  })

  it('API key 解析回退到加密存储并在解密失败时返回 null', async () => {
    await bootApp()
    const getApiKey = (globalThis as any).__getApiKey as (provider: string) => string | null
    mocks.modelConfigGetApiKey.mockReturnValue(null)
    mocks.appStoreGet.mockReturnValue(Buffer.from('encrypted:sk-legacy').toString('base64'))

    expect(getApiKey('openai')).toBe('sk-legacy')

    mocks.isEncryptionAvailable.mockReturnValue(false)
    expect(getApiKey('openai')).toBe(Buffer.from('encrypted:sk-legacy').toString('base64'))

    mocks.isEncryptionAvailable.mockReturnValue(true)
    mocks.decryptString.mockImplementation(() => {
      throw new Error('decrypt failed')
    })
    expect(getApiKey('openai')).toBeNull()
  })

  it('没有存储的 key 时返回 null', async () => {
    await bootApp()
    const getApiKey = (globalThis as any).__getApiKey as (provider: string) => string | null
    mocks.modelConfigGetApiKey.mockReturnValue(null)
    mocks.appStoreGet.mockReturnValue(undefined)

    expect(getApiKey('openai')).toBeNull()
  })
})
