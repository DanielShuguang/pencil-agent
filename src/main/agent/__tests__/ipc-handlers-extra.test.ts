import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const ipcHandlers = new Map<string, Function>()
const ipcListeners = new Map<string, Function>()
const nativeThemeListeners = new Map<string, Function>()
const mockWebContentsSend = vi.fn()

const electronMocks = vi.hoisted(() => ({
  mockAccess: vi.fn(),
  mockExec: vi.fn(),
  mockGetFocusedWindow: vi.fn(),
  mockShowOpenDialog: vi.fn(),
  mockIsEncryptionAvailable: vi.fn(),
  mockEncryptString: vi.fn(),
  mockDecryptString: vi.fn(),
}))

const appStoreMocks = vi.hoisted(() => ({
  mockAppStoreGet: vi.fn(),
  mockAppStoreSet: vi.fn(),
  mockAppStoreDelete: vi.fn(),
}))

const modelConfigMocks = vi.hoisted(() => ({
  mockList: vi.fn(),
  mockSave: vi.fn(),
  mockDelete: vi.fn(),
  mockTestConnection: vi.fn(),
  mockFetchModels: vi.fn(),
  mockSaveModel: vi.fn(),
  mockDeleteModel: vi.fn(),
  mockToggleModelVisibility: vi.fn(),
  mockGetApiKey: vi.fn(),
}))

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: Function) => {
      ipcHandlers.set(channel, handler)
    }),
    on: vi.fn((channel: string, handler: Function) => {
      ipcListeners.set(channel, handler)
    }),
  },
  safeStorage: {
    isEncryptionAvailable: electronMocks.mockIsEncryptionAvailable,
    encryptString: electronMocks.mockEncryptString,
    decryptString: electronMocks.mockDecryptString,
  },
  nativeTheme: {
    on: vi.fn((event: string, handler: Function) => {
      nativeThemeListeners.set(event, handler)
    }),
    shouldUseDarkColors: false,
    themeSource: 'system',
  },
  BrowserWindow: {
    getFocusedWindow: electronMocks.mockGetFocusedWindow,
  },
  dialog: {
    showOpenDialog: electronMocks.mockShowOpenDialog,
  },
}))

vi.mock('fs/promises', () => ({
  default: {
    access: electronMocks.mockAccess,
    constants: { R_OK: 4 },
  },
  access: electronMocks.mockAccess,
  constants: { R_OK: 4 },
}))

vi.mock('child_process', () => ({
  exec: electronMocks.mockExec,
  default: { exec: electronMocks.mockExec },
}))

vi.mock('../../lib/store', () => ({
  appStore: {
    get: appStoreMocks.mockAppStoreGet,
    set: appStoreMocks.mockAppStoreSet,
    delete: appStoreMocks.mockAppStoreDelete,
  },
}))

vi.mock('../role-manager', () => ({
  RoleManager: function () {
    return { list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() }
  },
}))

vi.mock('../model-config', () => ({
  ModelConfigManager: function () {
    return {
      list: modelConfigMocks.mockList,
      save: modelConfigMocks.mockSave,
      delete: modelConfigMocks.mockDelete,
      testConnection: modelConfigMocks.mockTestConnection,
      fetchModels: modelConfigMocks.mockFetchModels,
      saveModel: modelConfigMocks.mockSaveModel,
      deleteModel: modelConfigMocks.mockDeleteModel,
      toggleModelVisibility: modelConfigMocks.mockToggleModelVisibility,
      getApiKey: modelConfigMocks.mockGetApiKey,
    }
  },
}))

import { registerAgentHandlers } from '../ipc-handlers'
import type { AgentSessionManager } from '../session-manager'
import type { ToolRegistry } from '../tool-registry'

describe('agent ipc handlers (settings / permission / audit / system)', () => {
  let mainWindow: any
  let mockManager: AgentSessionManager
  let mockToolRegistry: ToolRegistry
  let mockPermissionManager: any
  let mockAuditLogger: any
  let mockModelConfigManager: any

  beforeEach(() => {
    vi.clearAllMocks()
    ipcHandlers.clear()
    ipcListeners.clear()
    nativeThemeListeners.clear()

    appStoreMocks.mockAppStoreGet.mockReset()
    appStoreMocks.mockAppStoreSet.mockReset()
    appStoreMocks.mockAppStoreDelete.mockReset()
    appStoreMocks.mockAppStoreGet.mockImplementation(
      (_key: string, defaultVal?: unknown) => defaultVal,
    )
    electronMocks.mockAccess.mockResolvedValue(undefined)
    electronMocks.mockIsEncryptionAvailable.mockReturnValue(true)
    electronMocks.mockEncryptString.mockImplementation((s: string) =>
      Buffer.from(`encrypted:${s}`),
    )
    electronMocks.mockDecryptString.mockImplementation((buf: Buffer) =>
      buf.toString().replace('encrypted:', ''),
    )
    electronMocks.mockGetFocusedWindow.mockReturnValue(null)

    mockManager = {
      create: vi.fn().mockResolvedValue(undefined),
      prompt: vi.fn(),
      stop: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn(),
      destroyAll: vi.fn(),
    } as any
    mockToolRegistry = { list: vi.fn(), get: vi.fn() } as any
    mockPermissionManager = {
      getConfig: vi.fn().mockReturnValue({ requireConfirmation: true }),
      updateConfig: vi.fn(),
    }
    mockAuditLogger = {
      getLogs: vi.fn().mockReturnValue([]),
      clearAll: vi.fn(),
    }
    mockModelConfigManager = {
      list: modelConfigMocks.mockList,
      save: modelConfigMocks.mockSave,
      delete: modelConfigMocks.mockDelete,
      testConnection: modelConfigMocks.mockTestConnection,
      fetchModels: modelConfigMocks.mockFetchModels,
      saveModel: modelConfigMocks.mockSaveModel,
      deleteModel: modelConfigMocks.mockDeleteModel,
      toggleModelVisibility: modelConfigMocks.mockToggleModelVisibility,
      getApiKey: modelConfigMocks.mockGetApiKey,
    }

    mainWindow = { webContents: { send: mockWebContentsSend } }
    registerAgentHandlers(
      mockManager as any,
      mainWindow,
      mockToolRegistry as any,
      mockModelConfigManager,
      mockPermissionManager,
      mockAuditLogger,
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('agent:create 工作空间校验', () => {
    it('目录不存在时返回中文错误', async () => {
      const error = Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
      electronMocks.mockAccess.mockRejectedValue(error)

      await expect(
        ipcHandlers.get('agent:create')!(
          {},
          { sessionId: 's1', model: { id: 'gpt-4', provider: 'openai' }, cwd: '/missing' },
        ),
      ).rejects.toThrow('工作空间不存在：/missing')
    })

    it('无权限时返回中文错误', async () => {
      const error = Object.assign(new Error('EACCES'), { code: 'EACCES' })
      electronMocks.mockAccess.mockRejectedValue(error)

      await expect(
        ipcHandlers.get('agent:create')!(
          {},
          { sessionId: 's1', model: { id: 'gpt-4', provider: 'openai' }, cwd: '/denied' },
        ),
      ).rejects.toThrow('无权限访问工作空间：/denied')
    })

    it('成功时持久化会话 cwd', async () => {
      await ipcHandlers.get('agent:create')!(
        {},
        { sessionId: 's1', model: { id: 'gpt-4', provider: 'openai' }, cwd: '/tmp' },
      )

      expect(appStoreMocks.mockAppStoreSet).toHaveBeenCalledWith('session:s1.cwd', '/tmp')
    })
  })

  describe('agent:prompt', () => {
    it('把持久化的 cwd 传给 session manager', async () => {
      appStoreMocks.mockAppStoreGet.mockImplementation((key: string) =>
        key === 'session:s1.cwd' ? '/workspace/app' : undefined,
      )
      mockManager.prompt = vi.fn().mockImplementation(async function* () {
        yield { type: 'text', content: 'ok' }
      })

      await ipcListeners.get('agent:prompt')!(
        {},
        { sessionId: 's1', message: 'hello', model: { id: 'gpt-4', provider: 'openai' } },
      )

      expect(mockManager.prompt).toHaveBeenCalledWith(
        's1',
        'hello',
        { id: 'gpt-4', provider: 'openai' },
        '/workspace/app',
      )
    })
  })

  describe('dialog:selectDirectory', () => {
    it('没有聚焦窗口时直接返回取消', async () => {
      const result = await ipcHandlers.get('dialog:selectDirectory')!()

      expect(result).toEqual({ canceled: true, filePaths: [] })
      expect(electronMocks.mockShowOpenDialog).not.toHaveBeenCalled()
    })

    it('有聚焦窗口时透传选择结果', async () => {
      const focusedWindow = { id: 1 }
      electronMocks.mockGetFocusedWindow.mockReturnValue(focusedWindow)
      electronMocks.mockShowOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: ['/picked'],
      })

      const result = await ipcHandlers.get('dialog:selectDirectory')!()

      expect(electronMocks.mockShowOpenDialog).toHaveBeenCalledWith(focusedWindow, {
        properties: ['openDirectory'],
      })
      expect(result).toEqual({ canceled: false, filePaths: ['/picked'] })
    })
  })

  describe('settings:save-key', () => {
    it('加密不可用时以明文保存', async () => {
      electronMocks.mockIsEncryptionAvailable.mockReturnValue(false)

      await ipcHandlers.get('settings:save-key')!({}, { provider: 'openai', key: 'sk-plain' })

      expect(appStoreMocks.mockAppStoreSet).toHaveBeenCalledWith('api-keys.openai', 'sk-plain')
    })

    it('保存失败时抛出异常', () => {
      appStoreMocks.mockAppStoreSet.mockImplementation(() => {
        throw new Error('disk full')
      })

      expect(() =>
        ipcHandlers.get('settings:save-key')!({}, { provider: 'openai', key: 'sk' }),
      ).toThrow('Failed to save API key')
    })
  })

  describe('settings:get-key', () => {
    it('未加密存储时直接返回原文', () => {
      electronMocks.mockIsEncryptionAvailable.mockReturnValue(false)
      appStoreMocks.mockAppStoreGet.mockReturnValue('sk-plain')

      expect(
        ipcHandlers.get('settings:get-key')!({}, { provider: 'openai' }),
      ).toBe('sk-plain')
    })

    it('解密抛错时返回 null', () => {
      appStoreMocks.mockAppStoreGet.mockReturnValue('broken-base64')
      electronMocks.mockDecryptString.mockImplementation(() => {
        throw new Error('decrypt failed')
      })

      expect(
        ipcHandlers.get('settings:get-key')!({}, { provider: 'openai' }),
      ).toBeNull()
    })
  })

  describe('settings:delete-key', () => {
    it('删除失败时抛出异常', () => {
      appStoreMocks.mockAppStoreDelete.mockImplementation(() => {
        throw new Error('locked')
      })

      expect(() =>
        ipcHandlers.get('settings:delete-key')!({}, { provider: 'openai' }),
      ).toThrow('Failed to delete API key')
    })
  })

  describe('settings:get-masked-key', () => {
    it('优先使用 ModelConfigManager 中的 key', () => {
      modelConfigMocks.mockGetApiKey.mockReturnValue('sk-custom-key-1234')

      expect(
        ipcHandlers.get('settings:get-masked-key')!({}, { provider: 'custom' }),
      ).toBe('sk-c***1234')
      expect(appStoreMocks.mockAppStoreGet).not.toHaveBeenCalled()
    })

    it('自定义 provider 的短 key 全部打码', () => {
      modelConfigMocks.mockGetApiKey.mockReturnValue('short')

      expect(
        ipcHandlers.get('settings:get-masked-key')!({}, { provider: 'custom' }),
      ).toBe('*****')
    })

    it('解密失败时返回 null', () => {
      modelConfigMocks.mockGetApiKey.mockReturnValue(null)
      appStoreMocks.mockAppStoreGet.mockReturnValue('broken')
      electronMocks.mockDecryptString.mockImplementation(() => {
        throw new Error('decrypt failed')
      })

      expect(
        ipcHandlers.get('settings:get-masked-key')!({}, { provider: 'openai' }),
      ).toBeNull()
    })
  })

  describe('settings:checkConnection', () => {
    it('自定义 provider 连通时直接返回 true', async () => {
      modelConfigMocks.mockTestConnection.mockResolvedValue({ success: true })

      await expect(
        ipcHandlers.get('settings:checkConnection')!({}, { provider: 'custom' }),
      ).resolves.toBe(true)
    })

    it('provider 存在但连通失败时返回 false', async () => {
      modelConfigMocks.mockTestConnection.mockResolvedValue({
        success: false,
        error: 'Connection timeout',
      })

      await expect(
        ipcHandlers.get('settings:checkConnection')!({}, { provider: 'custom' }),
      ).resolves.toBe(false)
    })

    it('legacy openai key 可用时返回 true 并携带 Authorization', async () => {
      modelConfigMocks.mockTestConnection.mockResolvedValue({
        success: false,
        error: 'Provider not found',
      })
      appStoreMocks.mockAppStoreGet.mockReturnValue(
        Buffer.from('encrypted:sk-legacy').toString('base64'),
      )
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 })
      vi.stubGlobal('fetch', fetchMock)

      await expect(
        ipcHandlers.get('settings:checkConnection')!({}, { provider: 'openai' }),
      ).resolves.toBe(true)

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: { Authorization: 'Bearer sk-legacy' },
        }),
      )
      vi.unstubAllGlobals()
    })

    it('legacy anthropic key 使用 x-api-key 与版本头', async () => {
      modelConfigMocks.mockTestConnection.mockResolvedValue({
        success: false,
        error: 'Provider not found',
      })
      appStoreMocks.mockAppStoreGet.mockReturnValue(
        Buffer.from('encrypted:sk-ant').toString('base64'),
      )
      const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 401 })
      vi.stubGlobal('fetch', fetchMock)

      await expect(
        ipcHandlers.get('settings:checkConnection')!({}, { provider: 'anthropic' }),
      ).resolves.toBe(true)

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          headers: {
            'x-api-key': 'sk-ant',
            'anthropic-version': '2023-06-01',
          },
        }),
      )
      vi.unstubAllGlobals()
    })

    it('没有存储 key 时返回 false', async () => {
      modelConfigMocks.mockTestConnection.mockResolvedValue({
        success: false,
        error: 'Provider not found',
      })
      appStoreMocks.mockAppStoreGet.mockReturnValue(undefined)

      await expect(
        ipcHandlers.get('settings:checkConnection')!({}, { provider: 'openai' }),
      ).resolves.toBe(false)
    })

    it('未知 provider 返回 false', async () => {
      modelConfigMocks.mockTestConnection.mockResolvedValue({
        success: false,
        error: 'Provider not found',
      })
      appStoreMocks.mockAppStoreGet.mockReturnValue(
        Buffer.from('encrypted:sk-x').toString('base64'),
      )

      await expect(
        ipcHandlers.get('settings:checkConnection')!({}, { provider: 'unknown' }),
      ).resolves.toBe(false)
    })

    it('网络错误返回 false', async () => {
      modelConfigMocks.mockTestConnection.mockResolvedValue({
        success: false,
        error: 'Provider not found',
      })
      appStoreMocks.mockAppStoreGet.mockReturnValue(
        Buffer.from('encrypted:sk-legacy').toString('base64'),
      )
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

      await expect(
        ipcHandlers.get('settings:checkConnection')!({}, { provider: 'openai' }),
      ).resolves.toBe(false)
      vi.unstubAllGlobals()
    })
  })

  describe('model-config handlers', () => {
    it('fetch-models / save-model / delete-model / toggle-visibility 透传参数', async () => {
      modelConfigMocks.mockFetchModels.mockReturnValue({ models: [] })

      await ipcHandlers.get('model-config:fetch-models')!({}, { providerId: 'p1' })
      expect(modelConfigMocks.mockFetchModels).toHaveBeenCalledWith('p1')

      await ipcHandlers.get('model-config:save-model')!(
        {},
        { providerId: 'p1', model: { id: 'm1' } },
      )
      expect(modelConfigMocks.mockSaveModel).toHaveBeenCalledWith('p1', { id: 'm1' })

      await ipcHandlers.get('model-config:delete-model')!({}, { providerId: 'p1', modelId: 'm1' })
      expect(modelConfigMocks.mockDeleteModel).toHaveBeenCalledWith('p1', 'm1')

      await ipcHandlers.get('model-config:toggle-visibility')!(
        {},
        { providerId: 'p1', modelId: 'm1' },
      )
      expect(modelConfigMocks.mockToggleModelVisibility).toHaveBeenCalledWith('p1', 'm1')
    })
  })

  describe('permission handlers', () => {
    it('读取权限配置', () => {
      expect(ipcHandlers.get('permission:getConfig')!()).toEqual({
        requireConfirmation: true,
      })
    })

    it('更新权限配置', async () => {
      await ipcHandlers.get('permission:setConfig')!({}, { requireConfirmation: false })

      expect(mockPermissionManager.updateConfig).toHaveBeenCalledWith({
        requireConfirmation: false,
      })
    })

    it('确认请求与响应完成往返', async () => {
      const promise = mainWindow.__requestConfirm({
        id: 'req-1',
        toolName: 'bash',
        parameters: { command: 'rm -rf /' },
      })

      expect(mockWebContentsSend).toHaveBeenCalledWith(
        'permission:confirm-request',
        expect.objectContaining({ id: 'req-1', toolName: 'bash' }),
      )

      await ipcHandlers.get('permission:confirm-response')!(
        {},
        { id: 'req-1', approved: true },
      )

      await expect(promise).resolves.toEqual({ id: 'req-1', approved: true })

      // 再次响应同一个 id 不应抛错
      expect(
        ipcHandlers.get('permission:confirm-response')!({}, { id: 'req-1', approved: false }),
      ).toBeUndefined()
    })

    it('未知的确认 id 被静默忽略', () => {
      expect(
        ipcHandlers.get('permission:confirm-response')!({}, { id: 'unknown', approved: true }),
      ).toBeUndefined()
    })
  })

  describe('audit handlers', () => {
    it('查询指定会话日志', () => {
      mockAuditLogger.getLogs.mockReturnValue([{ id: 'log-1' }])

      expect(ipcHandlers.get('audit:getLogs')!({}, 's1')).toEqual([{ id: 'log-1' }])
      expect(mockAuditLogger.getLogs).toHaveBeenCalledWith('s1')
    })

    it('清空全部日志', () => {
      ipcHandlers.get('audit:clearLogs')!({})

      expect(mockAuditLogger.clearAll).toHaveBeenCalled()
    })
  })

  describe('system:getFonts', () => {
    it('Windows 下解析注册表并去除字体后缀', async () => {
      vi.spyOn(process, 'platform', 'get').mockReturnValue('win32')
      electronMocks.mockExec.mockImplementation((_cmd: string, _opts: any, cb: Function) => {
        cb(null, {
          stdout: [
            'HKEY_LOCAL_MACHINE\\...',
            '    Arial (TrueType)    REG_SZ    arial.ttf',
            '    Maple Mono NF CN (OpenType)    REG_SZ    maplep.otf',
            '    Bad\\Path (TrueType)    REG_SZ    bad.ttf',
          ].join('\n'),
        })
        return {} as any
      })

      const fonts = await ipcHandlers.get('system:getFonts')!()

      expect(fonts).toEqual(['Arial', 'Maple Mono NF CN'])
      vi.restoreAllMocks()
    })

    it('Linux 下使用 fc-list 输出', async () => {
      vi.spyOn(process, 'platform', 'get').mockReturnValue('linux')
      electronMocks.mockExec.mockImplementation((_cmd: string, _opts: any, cb: Function) => {
        cb(null, { stdout: 'DejaVu Sans\nNoto Sans\n\n' })
        return {} as any
      })

      const fonts = await ipcHandlers.get('system:getFonts')!()

      expect(electronMocks.mockExec).toHaveBeenCalledWith(
        'fc-list : family | sort -u',
        { encoding: 'utf-8' },
        expect.any(Function),
      )
      expect(fonts).toEqual(['DejaVu Sans', 'Noto Sans'])
      vi.restoreAllMocks()
    })

    it('命令执行失败时返回空数组', async () => {
      vi.spyOn(process, 'platform', 'get').mockReturnValue('linux')
      electronMocks.mockExec.mockImplementation((_cmd: string, _opts: any, cb: Function) => {
        cb(new Error('command not found'))
        return {} as any
      })

      await expect(ipcHandlers.get('system:getFonts')!()).resolves.toEqual([])
      vi.restoreAllMocks()
    })
  })

  describe('theme handlers', () => {
    it('setTheme 持久化并广播状态', async () => {
      await ipcHandlers.get('theme:setTheme')!({}, 'light')

      expect(appStoreMocks.mockAppStoreSet).toHaveBeenCalledWith('theme.themeId', 'light')
      expect(mockWebContentsSend).toHaveBeenCalledWith(
        'theme:changed',
        expect.objectContaining({ mode: 'light', currentThemeId: 'light', isDark: false }),
      )
    })

    it('theme:get 在 system 模式下回退到 themeId', async () => {
      appStoreMocks.mockAppStoreGet.mockReturnValueOnce('system')
      appStoreMocks.mockAppStoreGet.mockReturnValueOnce('')

      expect(ipcHandlers.get('theme:get')!()).toEqual({
        mode: 'system',
        currentThemeId: 'light',
        isDark: false,
      })
    })

    it('系统主题变化时在 system 模式下广播', async () => {
      appStoreMocks.mockAppStoreGet.mockReturnValue('system')

      nativeThemeListeners.get('updated')!()

      expect(mockWebContentsSend).toHaveBeenCalledWith(
        'theme:changed',
        expect.objectContaining({ mode: 'system' }),
      )
    })

    it('非 system 模式下忽略系统主题变化', async () => {
      appStoreMocks.mockAppStoreGet.mockReturnValue('dark')

      nativeThemeListeners.get('updated')!()

      expect(mockWebContentsSend).not.toHaveBeenCalled()
    })
  })
})
