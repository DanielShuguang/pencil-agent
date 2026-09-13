import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  exposeInMainWorld: vi.fn(),
  invoke: vi.fn(),
  send: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
}))

vi.mock('electron', () => ({
  contextBridge: { exposeInMainWorld: mocks.exposeInMainWorld },
  ipcRenderer: {
    invoke: mocks.invoke,
    send: mocks.send,
    on: mocks.on,
    removeListener: mocks.removeListener,
    removeAllListeners: vi.fn(),
  },
}))

vi.mock('@electron-toolkit/preload', () => ({
  electronAPI: { versions: {} },
}))

const originalProcess = globalThis.process
Object.assign(process, { contextIsolated: true })

const api: Record<string, any> = {}
mocks.exposeInMainWorld.mockImplementation((key: string, value: Record<string, any>) => {
  if (key === 'api') Object.assign(api, value)
})

function lastCall(method: { mock: { calls: unknown[][] } }) {
  return method.mock.calls[method.mock.calls.length - 1]
}

function lastChannel(method: { mock: { calls: unknown[][] } }) {
  return lastCall(method)[0]
}

describe('preload IPC 契约', () => {
  beforeAll(async () => {
    await import('../index')
  })

  beforeEach(() => {
    mocks.invoke.mockClear()
    mocks.send.mockClear()
  })

  describe('invoke 通道名与参数顺序（renderer → main）', () => {
    it('agent', async () => {
      const config = {
        sessionId: 's1',
        model: { id: 'gpt-4', provider: 'openai' },
        cwd: '/tmp',
      }
      await api.agent.create(config)
      expect(mocks.invoke).toHaveBeenCalledWith('agent:create', config)
    })

    it('agent.prompt / agent.stop 使用 send', () => {
      const model = { id: 'gpt-4', provider: 'openai' }
      api.agent.prompt('s1', 'hi', model)
      expect(mocks.send).toHaveBeenCalledWith('agent:prompt', {
        sessionId: 's1',
        message: 'hi',
        model,
      })

      api.agent.stop('s1')
      expect(mocks.send).toHaveBeenCalledWith('agent:stop', 's1')
    })

    it('tool', async () => {
      await api.tool.list()
      expect(mocks.invoke).toHaveBeenCalledWith('tool:list')

      await api.tool.get('read')
      expect(mocks.invoke).toHaveBeenCalledWith('tool:get', 'read')
    })

    it('sandbox', async () => {
      const req = { code: '1+1', language: 'javascript' as const }
      await api.sandbox.execute(req)
      expect(mocks.invoke).toHaveBeenCalledWith('sandbox:execute', req)

      api.sandbox.stop('exec-1')
      expect(mocks.send).toHaveBeenCalledWith('sandbox:stop', 'exec-1')
    })

    it('workflow 透传 cwd 作为第三个参数', async () => {
      const definition = { nodes: [], edges: [] }
      const input = { key: 'value' }

      await api.workflow.execute(definition, input, '/workspace/app')

      expect(mocks.invoke).toHaveBeenCalledWith(
        'workflow:execute',
        definition,
        input,
        '/workspace/app',
      )
    })

    it('role', async () => {
      await api.role.list()
      expect(mocks.invoke).toHaveBeenCalledWith('role:list')
      await api.role.get('r1')
      expect(mocks.invoke).toHaveBeenCalledWith('role:get', 'r1')

      const role = { name: 'R', description: 'd', systemPrompt: 'p', tools: [] }
      await api.role.create(role)
      expect(mocks.invoke).toHaveBeenCalledWith('role:create', role)

      const updates = { name: 'R2' }
      await api.role.update('r1', updates)
      expect(mocks.invoke).toHaveBeenCalledWith('role:update', { id: 'r1', updates })

      await api.role.delete('r1')
      expect(mocks.invoke).toHaveBeenCalledWith('role:delete', 'r1')
    })

    it('memory 包装为对象参数', async () => {
      const metadata = { sessionId: 's1', role: 'user', timestamp: 1, tags: [] }
      await api.memory.store('content', metadata)
      expect(mocks.invoke).toHaveBeenCalledWith('memory:store', {
        content: 'content',
        metadata,
      })

      await api.memory.recall('query', 5)
      expect(mocks.invoke).toHaveBeenCalledWith('memory:recall', { query: 'query', topK: 5 })

      const filters = { sessionId: 's1' }
      await api.memory.search('query', filters)
      expect(mocks.invoke).toHaveBeenCalledWith('memory:search', { query: 'query', filters })

      await api.memory.delete('id-1')
      expect(mocks.invoke).toHaveBeenCalledWith('memory:delete', 'id-1')

      await api.memory.clearAll()
      expect(mocks.invoke).toHaveBeenCalledWith('memory:clear-all')
    })

    it('settings 与 modelConfig 的 providerId 包装', async () => {
      await api.settings.saveKey('openai', 'sk-test')
      expect(mocks.invoke).toHaveBeenCalledWith('settings:save-key', {
        provider: 'openai',
        key: 'sk-test',
      })

      await api.settings.getKey('openai')
      expect(mocks.invoke).toHaveBeenCalledWith('settings:get-key', { provider: 'openai' })

      await api.settings.deleteKey('openai')
      expect(mocks.invoke).toHaveBeenCalledWith('settings:delete-key', { provider: 'openai' })

      await api.settings.checkConnection('openai')
      expect(mocks.invoke).toHaveBeenCalledWith('settings:checkConnection', {
        provider: 'openai',
      })

      await api.settings.getMaskedKey('openai')
      expect(mocks.invoke).toHaveBeenCalledWith('settings:get-masked-key', {
        provider: 'openai',
      })

      await api.modelConfig.fetchModels('p1')
      expect(mocks.invoke).toHaveBeenCalledWith('model-config:fetch-models', {
        providerId: 'p1',
      })

      await api.modelConfig.toggleVisibility('p1', 'm1')
      expect(mocks.invoke).toHaveBeenCalledWith('model-config:toggle-visibility', {
        providerId: 'p1',
        modelId: 'm1',
      })

      await api.modelConfig.deleteModel('p1', 'm1')
      expect(mocks.invoke).toHaveBeenCalledWith('model-config:delete-model', {
        providerId: 'p1',
        modelId: 'm1',
      })
    })

    it('theme / permission / audit / updater / window / dialog / system / app', async () => {
      await api.theme.get()
      expect(lastChannel(mocks.invoke)).toBe('theme:get')
      await api.theme.setMode('dark')
      expect(mocks.invoke).toHaveBeenCalledWith('theme:setMode', 'dark')
      await api.theme.setTheme('light')
      expect(mocks.invoke).toHaveBeenCalledWith('theme:setTheme', 'light')

      await api.permission.getConfig()
      expect(lastChannel(mocks.invoke)).toBe('permission:getConfig')
      await api.permission.setConfig({ requireConfirmation: true })
      expect(mocks.invoke).toHaveBeenCalledWith('permission:setConfig', {
        requireConfirmation: true,
      })
      await api.permission.submitConfirmResponse({ id: 'req-1', approved: true })
      expect(mocks.invoke).toHaveBeenCalledWith('permission:confirm-response', {
        id: 'req-1',
        approved: true,
      })

      await api.audit.getLogs('s1')
      expect(mocks.invoke).toHaveBeenCalledWith('audit:getLogs', 's1')
      await api.audit.clearLogs()
      expect(lastChannel(mocks.invoke)).toBe('audit:clearLogs')

      await api.updater.check()
      expect(lastChannel(mocks.invoke)).toBe('updater:check')
      await api.updater.download()
      expect(lastChannel(mocks.invoke)).toBe('updater:download')
      await api.updater.install()
      expect(lastChannel(mocks.invoke)).toBe('updater:install')
      await api.updater.getStatus()
      expect(lastChannel(mocks.invoke)).toBe('updater:getStatus')

      await api.window.isMaximized()
      expect(lastChannel(mocks.invoke)).toBe('window:isMaximized')

      await api.dialog.selectDirectory()
      expect(lastChannel(mocks.invoke)).toBe('dialog:selectDirectory')

      await api.system.getFonts()
      expect(lastChannel(mocks.invoke)).toBe('system:getFonts')

      await api.app.getVersion()
      expect(lastChannel(mocks.invoke)).toBe('app:getVersion')
    })
  })

  describe('通道集合契约', () => {
    const EXPECTED_INVOKE_CHANNELS = [
      'agent:create',
      'app:getVersion',
      'audit:clearLogs',
      'audit:getLogs',
      'dialog:selectDirectory',
      'memory:clear-all',
      'memory:delete',
      'memory:recall',
      'memory:search',
      'memory:store',
      'model-config:delete',
      'model-config:delete-model',
      'model-config:fetch-models',
      'model-config:list',
      'model-config:save',
      'model-config:save-model',
      'model-config:test-connection',
      'model-config:toggle-visibility',
      'permission:confirm-response',
      'permission:getConfig',
      'permission:setConfig',
      'role:create',
      'role:delete',
      'role:get',
      'role:list',
      'role:update',
      'sandbox:execute',
      'settings:checkConnection',
      'settings:delete-key',
      'settings:get-key',
      'settings:get-masked-key',
      'settings:save-key',
      'system:getFonts',
      'theme:get',
      'theme:setMode',
      'theme:setTheme',
      'tool:get',
      'tool:list',
      'updater:check',
      'updater:download',
      'updater:getStatus',
      'updater:install',
      'window:isMaximized',
      'workflow:execute',
    ]

    it('invoke 通道集合与期望完全一致（防止改名漏改）', async () => {
      await api.agent.create({ sessionId: 's1', model: { id: 'm', provider: 'p' }, cwd: '/tmp' })
      await api.tool.list()
      await api.tool.get('read')
      await api.sandbox.execute({ code: '', language: 'javascript' })
      await api.workflow.execute({ nodes: [], edges: [] }, {})
      await api.role.list()
      await api.role.get('r1')
      await api.role.create({})
      await api.role.update('r1', {})
      await api.role.delete('r1')
      await api.memory.store('c', { sessionId: 's', role: 'user', timestamp: 0, tags: [] })
      await api.memory.recall('q')
      await api.memory.search('q')
      await api.memory.delete('id')
      await api.memory.clearAll()
      await api.settings.saveKey('p', 'k')
      await api.settings.getKey('p')
      await api.settings.deleteKey('p')
      await api.settings.checkConnection('p')
      await api.settings.getMaskedKey('p')
      await api.modelConfig.list()
      await api.modelConfig.save({ id: 'p' })
      await api.modelConfig.delete('p')
      await api.modelConfig.saveModel('p', { id: 'm' })
      await api.modelConfig.deleteModel('p', 'm')
      await api.modelConfig.toggleVisibility('p', 'm')
      await api.modelConfig.testConnection({ providerId: 'p' })
      await api.modelConfig.fetchModels('p')
      await api.theme.get()
      await api.theme.setMode('dark')
      await api.theme.setTheme('dark')
      await api.permission.getConfig()
      await api.permission.setConfig({})
      await api.permission.submitConfirmResponse({ id: 'r', approved: true })
      await api.audit.getLogs('s')
      await api.audit.clearLogs()
      await api.updater.check()
      await api.updater.download()
      await api.updater.install()
      await api.updater.getStatus()
      await api.window.isMaximized()
      await api.dialog.selectDirectory()
      await api.system.getFonts()
      await api.app.getVersion()

      const invoked = mocks.invoke.mock.calls.map((call) => call[0]) as string[]
      const unique = [...new Set(invoked)].sort((a, b) => a.localeCompare(b))

      expect(unique).toEqual([...EXPECTED_INVOKE_CHANNELS].sort((a, b) => a.localeCompare(b)))
    })

    it('send 通道集合与期望一致', () => {
      api.agent.prompt('s1', 'hi')
      api.agent.stop('s1')
      api.sandbox.stop('exec-1')
      api.window.minimize()
      api.window.maximize()
      api.window.close()

      const sent = [...new Set(mocks.send.mock.calls.map((call) => call[0]))].sort((a, b) =>
        String(a).localeCompare(String(b)),
      )
      expect(sent).toEqual([
        'agent:prompt',
        'agent:stop',
        'sandbox:stop',
        'window:close',
        'window:maximize',
        'window:minimize',
      ])
    })

    it('事件监听通道集合与期望一致', () => {
      api.agent.onChunk(vi.fn())
      api.agent.onDone(vi.fn())
      api.agent.onError(vi.fn())
      api.sandbox.onOutput(vi.fn())
      api.workflow.onProgress(vi.fn())
      api.theme.onThemeChanged(vi.fn())
      api.permission.onConfirmRequest(vi.fn())
      api.updater.onStatus(vi.fn())
      api.updater.onInfo(vi.fn())
      api.updater.onError(vi.fn())
      api.updater.onProgress(vi.fn())
      api.window.onMaximizedChanged(vi.fn())

      const listened = [...new Set(mocks.on.mock.calls.map((call) => call[0]))].sort((a, b) =>
        String(a).localeCompare(String(b)),
      )
      expect(listened).toEqual([
        'agent:chunk',
        'agent:done',
        'agent:error',
        'permission:confirm-request',
        'sandbox:output',
        'theme:changed',
        'updater:error',
        'updater:info',
        'updater:progress',
        'updater:status',
        'window:maximized-changed',
        'workflow:progress',
      ])
    })
  })

  describe('事件监听转发与清理', () => {
    it('每个事件都注册并能在清理时移除同一个 handler 引用', () => {
      const listeners: Array<{ name: string; register: () => () => void }> = [
        { name: 'agent:chunk', register: () => api.agent.onChunk(vi.fn()) },
        { name: 'agent:done', register: () => api.agent.onDone(vi.fn()) },
        { name: 'agent:error', register: () => api.agent.onError(vi.fn()) },
        { name: 'sandbox:output', register: () => api.sandbox.onOutput(vi.fn()) },
        { name: 'workflow:progress', register: () => api.workflow.onProgress(vi.fn()) },
        { name: 'theme:changed', register: () => api.theme.onThemeChanged(vi.fn()) },
        {
          name: 'permission:confirm-request',
          register: () => api.permission.onConfirmRequest(vi.fn()),
        },
        { name: 'updater:status', register: () => api.updater.onStatus(vi.fn()) },
        { name: 'updater:info', register: () => api.updater.onInfo(vi.fn()) },
        { name: 'updater:error', register: () => api.updater.onError(vi.fn()) },
        { name: 'updater:progress', register: () => api.updater.onProgress(vi.fn()) },
        {
          name: 'window:maximized-changed',
          register: () => api.window.onMaximizedChanged(vi.fn()),
        },
      ]

      for (const { name, register } of listeners) {
        const cleanup = register()

        expect(mocks.on).toHaveBeenCalledWith(name, expect.any(Function))
        const handler = lastCall(mocks.on)[1]

        cleanup()
        expect(mocks.removeListener).toHaveBeenCalledWith(name, handler)
      }
    })

    it('payload 被原样转发给回调', () => {
      const chunkCb = vi.fn()
      api.agent.onChunk(chunkCb)
      const chunkHandler = lastCall(mocks.on)[1] as Function
      chunkHandler({}, { type: 'text', content: 'hello' })
      expect(chunkCb).toHaveBeenCalledWith({ type: 'text', content: 'hello' })

      const confirmCb = vi.fn()
      api.permission.onConfirmRequest(confirmCb)
      const confirmHandler = lastCall(mocks.on)[1] as Function
      confirmHandler({}, { id: 'req-1', toolName: 'bash' })
      expect(confirmCb).toHaveBeenCalledWith({ id: 'req-1', toolName: 'bash' })
    })
  })
})

describe('preload 在非 contextIsolation 环境下的回退', () => {
  it('直接挂载到 window 上', async () => {
    const exposedWindow: Record<string, any> = {}
    vi.resetModules()
    vi.stubGlobal('window', exposedWindow)
    const partialProcess = Object.assign(Object.create(originalProcess), { contextIsolated: false })
    vi.stubGlobal('process', partialProcess)

    const { contextBridge } = await import('electron')
    mocks.exposeInMainWorld.mockClear()
    await import('../index')

    expect(exposedWindow.api).toBeDefined()
    expect(exposedWindow.api.agent).toBeDefined()
    expect(exposedWindow.electron).toEqual({ versions: {} })
    expect(contextBridge.exposeInMainWorld).not.toHaveBeenCalled()

    vi.unstubAllGlobals()
  })

  afterAll(() => {
    Object.assign(process, { contextIsolated: true })
  })
})
