import { describe, it, expect, vi, beforeEach } from 'vitest'

const ipcHandlers = new Map<string, Function>()
const ipcListeners = new Map<string, Function>()
const mockWebContentsSend = vi.fn()

const roleMocks = vi.hoisted(() => ({
  mockRoleList: vi.fn(),
  mockRoleGet: vi.fn(),
  mockRoleCreate: vi.fn(),
  mockRoleUpdate: vi.fn(),
  mockRoleDelete: vi.fn(),
}))

const modelConfigMocks = vi.hoisted(() => ({
  mockModelConfigList: vi.fn(),
  mockModelConfigSave: vi.fn(),
  mockModelConfigDelete: vi.fn(),
  mockModelConfigTestConnection: vi.fn(),
  mockModelConfigSaveModel: vi.fn(),
  mockModelConfigDeleteModel: vi.fn(),
}))

const appStoreMocks = vi.hoisted(() => ({
  mockAppStoreGet: vi.fn((key: string, defaultVal?: unknown) => {
    if (key === 'theme.mode') return 'system'
    if (key === 'api-keys.openai') return Buffer.from('encrypted:sk-real').toString('base64')
    return defaultVal
  }),
  mockAppStoreSet: vi.fn(),
  mockAppStoreDelete: vi.fn(),
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
    isEncryptionAvailable: vi.fn(() => true),
    encryptString: vi.fn((str: string) => Buffer.from(`encrypted:${str}`)),
    decryptString: vi.fn((buf: Buffer) => buf.toString().replace('encrypted:', '')),
  },
  nativeTheme: {
    on: vi.fn(),
    get shouldUseDarkColors() {
      return false
    },
    set themeSource(_val: string) {},
  },
}))

vi.mock('../role-manager', () => ({
  RoleManager: function () {
    return {
      list: roleMocks.mockRoleList,
      get: roleMocks.mockRoleGet,
      create: roleMocks.mockRoleCreate,
      update: roleMocks.mockRoleUpdate,
      delete: roleMocks.mockRoleDelete,
    }
  },
}))

vi.mock('../model-config', () => ({
  ModelConfigManager: function () {
    return {
      list: modelConfigMocks.mockModelConfigList,
      save: modelConfigMocks.mockModelConfigSave,
      delete: modelConfigMocks.mockModelConfigDelete,
      testConnection: modelConfigMocks.mockModelConfigTestConnection,
      saveModel: modelConfigMocks.mockModelConfigSaveModel,
      deleteModel: modelConfigMocks.mockModelConfigDeleteModel,
    }
  },
}))

vi.mock('../../lib/store', () => ({
  appStore: {
    get: appStoreMocks.mockAppStoreGet,
    set: appStoreMocks.mockAppStoreSet,
    delete: appStoreMocks.mockAppStoreDelete,
  },
}))

import { registerAgentHandlers } from '../ipc-handlers'
import type { AgentSessionManager } from '../session-manager'
import type { ToolRegistry } from '../tool-registry'

describe('registerAgentHandlers', () => {
  let mainWindow: any
  let mockManager: AgentSessionManager
  let mockToolRegistry: ToolRegistry

  beforeEach(() => {
    vi.clearAllMocks()
    ipcHandlers.clear()
    ipcListeners.clear()
    mockWebContentsSend.mockClear()

    mockManager = {
      create: vi.fn().mockResolvedValue(undefined),
      prompt: vi.fn() as any,
      stop: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn(),
      destroyAll: vi.fn(),
    } as any

    mockToolRegistry = {
      list: vi.fn().mockReturnValue([{ name: 'read' }, { name: 'write' }]),
      get: vi.fn().mockReturnValue({ name: 'read', description: 'Read file', parameters: {} }),
      has: vi.fn().mockReturnValue(true),
      register: vi.fn(),
      unregister: vi.fn(),
      clear: vi.fn(),
    } as any

    mainWindow = { webContents: { send: mockWebContentsSend } }
    registerAgentHandlers(mockManager as any, mainWindow, mockToolRegistry as any)
  })

  describe('agent:create', () => {
    it('should create a session and return id', async () => {
      const handler = ipcHandlers.get('agent:create')!
      const result = await handler(
        {},
        { sessionId: 'session-1', model: { id: 'gpt-4', provider: 'openai' } },
      )
      expect(result).toBe('session-1')
      expect(mockManager.create).toHaveBeenCalledWith({
        sessionId: 'session-1',
        model: { id: 'gpt-4', provider: 'openai' },
      })
    })

    it('should throw when creation fails', async () => {
      ;(mockManager.create as any).mockRejectedValue(new Error('Creation error'))
      const handler = ipcHandlers.get('agent:create')!
      await expect(
        handler({}, { sessionId: 's1', model: { id: 'gpt-4', provider: 'openai' } }),
      ).rejects.toThrow('Failed to create session: Error: Creation error')
    })
  })

  describe('agent:prompt', () => {
    it('should send chunks and done event', async () => {
      const asyncGen = async function* () {
        yield { type: 'text', content: 'Hello' }
      }
      ;(mockManager.prompt as any).mockReturnValue(asyncGen())
      const handler = ipcListeners.get('agent:prompt')!
      await handler({}, { sessionId: 's1', message: 'Hi' })
      expect(mockWebContentsSend).toHaveBeenCalledWith('agent:chunk', {
        type: 'text',
        content: 'Hello',
      })
      expect(mockWebContentsSend).toHaveBeenCalledWith('agent:done')
    })

    it('should send error on failure', async () => {
      ;(mockManager.prompt as any).mockReturnValue(undefined)
      const handler = ipcListeners.get('agent:prompt')!
      await handler({}, { sessionId: 's1', message: 'Hi' })
      expect(mockWebContentsSend).toHaveBeenCalledWith(
        'agent:error',
        expect.stringContaining('Error'),
      )
    })
  })

  describe('agent:stop', () => {
    it('should stop the session', async () => {
      const handler = ipcListeners.get('agent:stop')!
      await handler({}, 'session-1')
      expect(mockManager.stop).toHaveBeenCalledWith('session-1')
    })

    it('should handle stop errors gracefully', async () => {
      ;(mockManager.stop as any).mockRejectedValue(new Error('Stop error'))
      const handler = ipcListeners.get('agent:stop')!
      await expect(handler({}, 'session-1')).resolves.toBeUndefined()
    })
  })

  describe('tool:list', () => {
    it('should return tool list', async () => {
      const handler = ipcHandlers.get('tool:list')!
      const result = await handler()
      expect(result).toEqual([{ name: 'read' }, { name: 'write' }])
    })
  })

  describe('settings:save-key', () => {
    it('should encrypt and save API key', async () => {
      const handler = ipcHandlers.get('settings:save-key')!
      await handler({}, { provider: 'openai', key: 'sk-test' })
      expect(appStoreMocks.mockAppStoreSet).toHaveBeenCalledWith(
        'api-keys.openai',
        expect.any(String),
      )
    })
  })

  describe('settings:get-key', () => {
    it('should decrypt and return API key', async () => {
      const handler = ipcHandlers.get('settings:get-key')!
      const result = await handler({}, { provider: 'openai' })
      expect(result).toBe('sk-real')
    })

    it('should return null for missing key', async () => {
      appStoreMocks.mockAppStoreGet.mockReturnValueOnce(undefined)
      const handler = ipcHandlers.get('settings:get-key')!
      const result = await handler({}, { provider: 'unknown' })
      expect(result).toBeNull()
    })
  })

  describe('role CRUD', () => {
    it('should list roles', async () => {
      roleMocks.mockRoleList.mockReturnValue([{ id: 'r1', name: 'Researcher' }])
      const result = await ipcHandlers.get('role:list')!()
      expect(result).toEqual([{ id: 'r1', name: 'Researcher' }])
    })

    it('should create role', async () => {
      roleMocks.mockRoleCreate.mockReturnValue({ id: 'r1', name: 'New Role' })
      const result = await ipcHandlers.get('role:create')!(
        {},
        {
          name: 'New Role',
          description: 'A role',
          systemPrompt: 'You are...',
          model: { id: 'gpt-4', provider: 'openai' },
          tools: [],
        },
      )
      expect(result).toEqual({ id: 'r1', name: 'New Role' })
    })

    it('should delete role', async () => {
      roleMocks.mockRoleDelete.mockReturnValue(true)
      const result = await ipcHandlers.get('role:delete')!({}, 'r1')
      expect(result).toBe(true)
    })
  })

  describe('model-config', () => {
    it('should save and delete', async () => {
      const provider = { id: 'openai', name: 'OpenAI' }
      modelConfigMocks.mockModelConfigSave.mockReturnValue({
        ...provider,
        createdAt: 100,
        updatedAt: 100,
      })
      const result = await ipcHandlers.get('model-config:save')!({}, provider)
      expect(result).toHaveProperty('createdAt')
      expect(modelConfigMocks.mockModelConfigSave).toHaveBeenCalledWith(provider)

      await ipcHandlers.get('model-config:delete')!({}, 'openai')
      expect(modelConfigMocks.mockModelConfigDelete).toHaveBeenCalledWith('openai')

      modelConfigMocks.mockModelConfigTestConnection.mockResolvedValue({ success: true })
      const testResult = await ipcHandlers.get('model-config:test-connection')!(
        {},
        { providerId: 'openai' },
      )
      expect(testResult).toEqual({ success: true })
    })
  })

  describe('theme handlers', () => {
    it('should get theme state', async () => {
      const result = await ipcHandlers.get('theme:get')!()
      expect(result).toHaveProperty('mode', 'system')
    })

    it('should set theme mode', async () => {
      await ipcHandlers.get('theme:setMode')!({}, 'dark')
      expect(mockWebContentsSend).toHaveBeenCalledWith(
        'theme:changed',
        expect.objectContaining({ mode: 'dark' }),
      )
    })
  })
})
