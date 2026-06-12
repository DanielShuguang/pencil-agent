import { describe, it, expect, vi, beforeAll } from 'vitest'

const mocks = vi.hoisted(() => ({
  mockContextBridgeExpose: vi.fn(),
  mockIpcRendererOn: vi.fn(),
  mockIpcRendererRemoveAllListeners: vi.fn(),
  mockIpcRendererInvoke: vi.fn(),
  mockIpcRendererSend: vi.fn(),
  mockIpcRendererRemoveListener: vi.fn(),
}))

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: mocks.mockContextBridgeExpose,
  },
  ipcRenderer: {
    on: mocks.mockIpcRendererOn,
    removeAllListeners: mocks.mockIpcRendererRemoveAllListeners,
    invoke: mocks.mockIpcRendererInvoke,
    send: mocks.mockIpcRendererSend,
    removeListener: mocks.mockIpcRendererRemoveListener,
  },
}))

vi.mock('@electron-toolkit/preload', () => ({
  electronAPI: { versions: {} },
}))

describe('preload API surface', () => {
  const api: Record<string, any> = {}

  beforeAll(() => {
    vi.stubGlobal('process', { ...process, contextIsolated: true })
    mocks.mockContextBridgeExpose.mockImplementation((_key: string, val: Record<string, any>) => {
      if (_key === 'api') Object.assign(api, val)
    })
    return import('../index')
  })

  it('should expose agent namespace', () => {
    expect(api.agent).toBeDefined()
    expect(api.agent.create).toBeInstanceOf(Function)
    expect(api.agent.prompt).toBeInstanceOf(Function)
    expect(api.agent.stop).toBeInstanceOf(Function)
    expect(api.agent.validateCwd).toBeInstanceOf(Function)
    expect(api.agent.onChunk).toBeInstanceOf(Function)
    expect(api.agent.onDone).toBeInstanceOf(Function)
    expect(api.agent.onError).toBeInstanceOf(Function)
  })

  it('should expose tool namespace with list and get', () => {
    expect(api.tool).toBeDefined()
    expect(api.tool.list).toBeInstanceOf(Function)
    expect(api.tool.get).toBeInstanceOf(Function)
  })

  it('should expose settings namespace', () => {
    expect(api.settings).toBeDefined()
    expect(api.settings.saveKey).toBeInstanceOf(Function)
    expect(api.settings.getKey).toBeInstanceOf(Function)
  })

  it('should expose role namespace', () => {
    expect(api.role).toBeDefined()
    expect(api.role.list).toBeInstanceOf(Function)
    expect(api.role.get).toBeInstanceOf(Function)
    expect(api.role.create).toBeInstanceOf(Function)
    expect(api.role.update).toBeInstanceOf(Function)
    expect(api.role.delete).toBeInstanceOf(Function)
  })

  it('should expose modelConfig namespace', () => {
    expect(api.modelConfig).toBeDefined()
    expect(api.modelConfig.list).toBeInstanceOf(Function)
    expect(api.modelConfig.save).toBeInstanceOf(Function)
    expect(api.modelConfig.delete).toBeInstanceOf(Function)
    expect(api.modelConfig.testConnection).toBeInstanceOf(Function)
    expect(api.modelConfig.saveModel).toBeInstanceOf(Function)
    expect(api.modelConfig.deleteModel).toBeInstanceOf(Function)
  })

  it('should expose updater namespace', () => {
    expect(api.updater).toBeDefined()
    expect(api.updater.check).toBeInstanceOf(Function)
    expect(api.updater.download).toBeInstanceOf(Function)
    expect(api.updater.install).toBeInstanceOf(Function)
  })

  it('should expose sandbox namespace', () => {
    expect(api.sandbox).toBeDefined()
    expect(api.sandbox.execute).toBeInstanceOf(Function)
    expect(api.sandbox.stop).toBeInstanceOf(Function)
    expect(api.sandbox.onOutput).toBeInstanceOf(Function)
  })

  it('should expose workflow namespace', () => {
    expect(api.workflow).toBeDefined()
    expect(api.workflow.execute).toBeInstanceOf(Function)
    expect(api.workflow.onProgress).toBeInstanceOf(Function)
  })

  it('should expose memory namespace', () => {
    expect(api.memory).toBeDefined()
    expect(api.memory.store).toBeInstanceOf(Function)
    expect(api.memory.recall).toBeInstanceOf(Function)
    expect(api.memory.search).toBeInstanceOf(Function)
    expect(api.memory.delete).toBeInstanceOf(Function)
    expect(api.memory.clearAll).toBeInstanceOf(Function)
  })

  it('should expose theme namespace', () => {
    expect(api.theme).toBeDefined()
    expect(api.theme.get).toBeInstanceOf(Function)
    expect(api.theme.setMode).toBeInstanceOf(Function)
  })

  it('should expose window namespace', () => {
    expect(api.window).toBeDefined()
    expect(api.window.minimize).toBeInstanceOf(Function)
    expect(api.window.maximize).toBeInstanceOf(Function)
    expect(api.window.close).toBeInstanceOf(Function)
  })

  it('should expose app namespace', () => {
    expect(api.app).toBeDefined()
    expect(api.app.getVersion).toBeInstanceOf(Function)
  })

  describe('listener cleanup', () => {
    it('should register and cleanup event listeners', () => {
      const cb = vi.fn()
      const cleanup = api.agent.onChunk(cb)
      expect(mocks.mockIpcRendererOn).toHaveBeenCalledWith('agent:chunk', expect.any(Function))
      cleanup()
      expect(mocks.mockIpcRendererRemoveListener).toHaveBeenCalledWith(
        'agent:chunk',
        expect.any(Function),
      )
    })
  })
})
