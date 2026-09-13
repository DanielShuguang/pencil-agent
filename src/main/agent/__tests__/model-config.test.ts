import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockStore = new Map<string, unknown>()

vi.mock('electron', () => ({
  safeStorage: {
    isEncryptionAvailable: vi.fn(() => true),
    encryptString: vi.fn((str: string) => Buffer.from(`encrypted:${str}`)),
    decryptString: vi.fn((buf: Buffer) => buf.toString().replace('encrypted:', '')),
  },
}))

vi.mock('electron-store', () => {
  class MockStore {
    get(key: string) {
      return mockStore.get(key)
    }
    set(key: string, value: unknown) {
      mockStore.set(key, value)
    }
  }
  return { default: MockStore }
})

import { ModelConfigManager } from '../model-config'
import { safeStorage } from 'electron'

describe('ModelConfigManager', () => {
  let manager: ModelConfigManager

  beforeEach(() => {
    mockStore.clear()
    vi.clearAllMocks()
    // 恢复默认的 safeStorage 行为（clearAllMocks 会清掉 mock 实现）
    vi.mocked(safeStorage.isEncryptionAvailable).mockReturnValue(true)
    vi.mocked(safeStorage.encryptString).mockImplementation((str: string) =>
      Buffer.from(`encrypted:${str}`),
    )
    vi.mocked(safeStorage.decryptString).mockImplementation((buf: Buffer) =>
      buf.toString().replace('encrypted:', ''),
    )
    manager = new ModelConfigManager()
  })

  describe('list', () => {
    it('should return empty list when no providers', () => {
      const result = manager.list()
      expect(result).toEqual([])
    })

    it('should return providers without apiKey', () => {
      manager.save({
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test',
        apiFormat: 'openai',
        models: [],
      })

      const result = manager.list()
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('openai')
      expect(result[0]).not.toHaveProperty('apiKey')
    })
  })

  describe('save', () => {
    it('should save a new provider', () => {
      const result = manager.save({
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test',
        apiFormat: 'openai',
        models: [],
      })

      expect(result.id).toBe('openai')
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
    })

    it('should preserve createdAt on update', () => {
      const first = manager.save({
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test',
        apiFormat: 'openai',
        models: [],
      })

      const second = manager.save({
        id: 'openai',
        name: 'OpenAI Updated',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-new',
        apiFormat: 'openai',
        models: [],
      })

      expect(second.createdAt).toBe(first.createdAt)
      expect(second.updatedAt).toBeGreaterThanOrEqual(first.updatedAt)
    })

    it('should encrypt API key on save', () => {
      manager.save({
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test',
        apiFormat: 'openai',
        models: [],
      })

      expect(safeStorage.encryptString).toHaveBeenCalledWith('sk-test')
    })
  })

  describe('delete', () => {
    it('should delete a provider', () => {
      manager.save({
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test',
        apiFormat: 'openai',
        models: [],
      })

      manager.delete('openai')
      expect(manager.list()).toHaveLength(0)
    })

    it('should not throw when deleting non-existent provider', () => {
      expect(() => manager.delete('non-existent')).not.toThrow()
    })
  })

  describe('saveModel', () => {
    it('should add a model to provider', () => {
      manager.save({
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test',
        apiFormat: 'openai',
        models: [],
      })

      manager.saveModel('openai', {
        id: 'gpt-4o',
        name: 'GPT-4o',
        providerId: 'openai',
      })

      const providers = manager.list()
      expect(providers[0].models).toHaveLength(1)
      expect(providers[0].models[0].id).toBe('gpt-4o')
    })

    it('should update existing model', () => {
      manager.save({
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test',
        apiFormat: 'openai',
        models: [],
      })

      manager.saveModel('openai', {
        id: 'gpt-4o',
        name: 'GPT-4o',
        providerId: 'openai',
      })

      manager.saveModel('openai', {
        id: 'gpt-4o',
        name: 'GPT-4o Updated',
        providerId: 'openai',
      })

      const providers = manager.list()
      expect(providers[0].models).toHaveLength(1)
      expect(providers[0].models[0].name).toBe('GPT-4o Updated')
    })

    it('should throw when provider not found', () => {
      expect(() =>
        manager.saveModel('non-existent', {
          id: 'model',
          name: 'Model',
          providerId: 'non-existent',
        }),
      ).toThrow("Provider 'non-existent' not found")
    })
  })

  describe('deleteModel', () => {
    it('should delete a model from provider', () => {
      manager.save({
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test',
        apiFormat: 'openai',
        models: [
          { id: 'gpt-4o', name: 'GPT-4o', providerId: 'openai' },
          { id: 'gpt-3.5', name: 'GPT-3.5', providerId: 'openai' },
        ],
      })

      manager.deleteModel('openai', 'gpt-4o')

      const providers = manager.list()
      expect(providers[0].models).toHaveLength(1)
      expect(providers[0].models[0].id).toBe('gpt-3.5')
    })

    it('should throw when provider not found', () => {
      expect(() => manager.deleteModel('non-existent', 'model')).toThrow(
        "Provider 'non-existent' not found",
      )
    })
  })

  describe('testConnection', () => {
    it('should return success for valid OpenAI connection', async () => {
      manager.save({
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test',
        apiFormat: 'openai',
        models: [],
      })

      const mockFetch = vi.fn().mockResolvedValue({ ok: true })
      vi.stubGlobal('fetch', mockFetch)

      const result = await manager.testConnection('openai')
      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer sk-test',
          }),
        }),
      )
    })

    it('should return error for non-existent provider', async () => {
      const result = await manager.testConnection('non-existent')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Provider not found')
    })

    it('should return error for failed OpenAI connection', async () => {
      manager.save({
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test',
        apiFormat: 'openai',
        models: [],
      })

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          json: vi.fn().mockResolvedValue({ error: { message: 'Invalid API key' } }),
        }),
      )

      const result = await manager.testConnection('openai')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid API key')
    })

    it('should handle network errors', async () => {
      manager.save({
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test',
        apiFormat: 'openai',
        models: [],
      })

      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

      const result = await manager.testConnection('openai')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })

    it('should return success for valid Anthropic connection', async () => {
      manager.save({
        id: 'anthropic',
        name: 'Anthropic',
        baseUrl: 'https://api.anthropic.com',
        apiKey: 'sk-ant-test',
        apiFormat: 'anthropic',
        models: [],
      })

      const mockFetch = vi.fn().mockResolvedValue({ ok: true })
      vi.stubGlobal('fetch', mockFetch)

      const result = await manager.testConnection('anthropic')
      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'x-api-key': 'sk-ant-test',
          }),
        }),
      )
    })

    it('should return error for failed Anthropic connection', async () => {
      manager.save({
        id: 'anthropic',
        name: 'Anthropic',
        baseUrl: 'https://api.anthropic.com',
        apiKey: 'sk-ant-invalid',
        apiFormat: 'anthropic',
        models: [],
      })

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          json: vi.fn().mockResolvedValue({ error: { message: 'Invalid API key' } }),
        }),
      )

      const result = await manager.testConnection('anthropic')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid API key')
    })
  })

  describe('loadFromStorage', () => {
    it('should load providers from storage', () => {
      const encryptedKey = Buffer.from('encrypted:sk-stored').toString('base64')
      mockStore.set('modelProviders', [
        {
          id: 'stored',
          name: 'Stored Provider',
          baseUrl: 'https://api.stored.com/v1',
          encryptedApiKey: encryptedKey,
          models: [],
          createdAt: 1000,
          updatedAt: 2000,
        },
      ])

      const newManager = new ModelConfigManager()
      const providers = newManager.list()

      expect(providers).toHaveLength(1)
      expect(providers[0].id).toBe('stored')
    })
  })

  describe('getApiKey', () => {
    it('returns the decrypted key for an existing provider', () => {
      manager.save({
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-secret',
        apiFormat: 'openai',
        models: [],
      })

      expect(manager.getApiKey('openai')).toBe('sk-secret')
    })

    it('returns null for an unknown provider', () => {
      expect(manager.getApiKey('missing')).toBeNull()
    })
  })

  describe('reload', () => {
    it('reloads providers written by another manager instance', () => {
      manager.save({
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test',
        apiFormat: 'openai',
        models: [],
      })

      const fresh = new ModelConfigManager()
      // 构造时即完成加载；reload 用于 safeStorage 可用后重新读取
      expect(fresh.list()).toHaveLength(1)
      fresh.reload()
      expect(fresh.list()).toHaveLength(1)
      expect(fresh.getApiKey('openai')).toBe('sk-test')
    })

    it('reload 会用存储中的最新内容替换内存状态', () => {
      manager.save({
        id: 'first',
        name: 'First',
        baseUrl: 'https://api.first.com/v1',
        apiKey: 'sk-first',
        apiFormat: 'openai',
        models: [],
      })

      mockStore.set('modelProviders', [
        {
          id: 'second',
          name: 'Second',
          baseUrl: 'https://api.second.com/v1',
          encryptedApiKey: Buffer.from('encrypted:sk-second').toString('base64'),
          apiFormat: 'openai',
          models: [],
          createdAt: 1,
          updatedAt: 2,
        },
      ])

      manager.reload()

      expect(manager.list().map((p) => p.id)).toEqual(['second'])
      expect(manager.getApiKey('second')).toBe('sk-second')
    })

    it('does not load providers when encryption is unavailable', () => {
      manager.save({
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test',
        apiFormat: 'openai',
        models: [],
      })

      vi.mocked(safeStorage.isEncryptionAvailable).mockReturnValue(false)
      const fresh = new ModelConfigManager()

      expect(fresh.list()).toEqual([])
    })

    it('throws when saving without encryption support', () => {
      vi.mocked(safeStorage.isEncryptionAvailable).mockReturnValue(false)

      expect(() =>
        manager.save({
          id: 'openai',
          name: 'OpenAI',
          baseUrl: 'https://api.openai.com/v1',
          apiKey: 'sk-test',
          apiFormat: 'openai',
          models: [],
        }),
      ).toThrow('System encryption is not available')
    })
  })

  describe('toggleModelVisibility', () => {
    beforeEach(() => {
      manager.save({
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test',
        apiFormat: 'openai',
        models: [{ id: 'gpt-4o', name: 'GPT-4o', providerId: 'openai' }],
      })
    })

    it('hides a visible model', () => {
      manager.toggleModelVisibility('openai', 'gpt-4o')

      expect(manager.list()[0].models[0].visible).toBe(false)
    })

    it('shows a hidden model again', () => {
      manager.toggleModelVisibility('openai', 'gpt-4o')
      manager.toggleModelVisibility('openai', 'gpt-4o')

      expect(manager.list()[0].models[0].visible).toBe(true)
    })

    it('throws for an unknown provider', () => {
      expect(() => manager.toggleModelVisibility('missing', 'gpt-4o')).toThrow(
        "Provider 'missing' not found",
      )
    })

    it('throws for an unknown model', () => {
      expect(() => manager.toggleModelVisibility('openai', 'missing')).toThrow(
        "Model 'missing' not found",
      )
    })
  })

  describe('fetchModels', () => {
    it('parses the OpenAI data.data response shape', async () => {
      manager.save({
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test',
        apiFormat: 'openai',
        models: [],
      })
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ data: [{ id: 'gpt-4o' }, { name: 'gpt-4o-mini' }] }),
      })
      vi.stubGlobal('fetch', mockFetch)

      const result = await manager.fetchModels('openai')

      expect(result.error).toBeUndefined()
      expect(result.models).toEqual([
        { id: 'gpt-4o', name: 'gpt-4o', providerId: 'openai' },
        { id: 'gpt-4o-mini', name: 'gpt-4o-mini', providerId: 'openai' },
      ])
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        expect.objectContaining({ method: 'GET' }),
      )
    })

    it('parses the Anthropic data.models response shape with version header', async () => {
      manager.save({
        id: 'anthropic',
        name: 'Anthropic',
        baseUrl: 'https://api.anthropic.com',
        apiKey: 'sk-ant',
        apiFormat: 'anthropic',
        models: [],
      })
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ models: [{ model: 'claude-sonnet' }] }),
      })
      vi.stubGlobal('fetch', mockFetch)

      const result = await manager.fetchModels('anthropic')

      expect(result.models).toEqual([
        { id: 'claude-sonnet', name: 'claude-sonnet', providerId: 'anthropic' },
      ])
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/models',
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-api-key': 'sk-ant',
            'anthropic-version': '2023-06-01',
          }),
        }),
      )
    })

    it('filters out entries without id/name/model', async () => {
      manager.save({
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test',
        apiFormat: 'openai',
        models: [],
      })
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue({ data: [{ id: 'gpt-4o' }, {}] }),
        }),
      )

      const result = await manager.fetchModels('openai')

      expect(result.models).toHaveLength(1)
    })

    it('returns the API error message for non-2xx responses', async () => {
      manager.save({
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test',
        apiFormat: 'openai',
        models: [],
      })
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
          json: vi.fn().mockResolvedValue({ error: { message: 'Invalid API key' } }),
        }),
      )

      await expect(manager.fetchModels('openai')).resolves.toEqual({
        models: [],
        error: 'Invalid API key',
      })
    })

    it('falls back to the HTTP status when the error body is unparseable', async () => {
      manager.save({
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test',
        apiFormat: 'openai',
        models: [],
      })
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          json: vi.fn().mockRejectedValue(new Error('invalid json')),
        }),
      )

      await expect(manager.fetchModels('openai')).resolves.toEqual({
        models: [],
        error: 'HTTP 500',
      })
    })

    it('maps AbortError to a timeout message', async () => {
      manager.save({
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test',
        apiFormat: 'openai',
        models: [],
      })
      const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' })
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError))

      await expect(manager.fetchModels('openai')).resolves.toEqual({
        models: [],
        error: 'Connection timeout',
      })
    })

    it('returns unknown errors as-is', async () => {
      manager.save({
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test',
        apiFormat: 'openai',
        models: [],
      })
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('socket hang up')))

      await expect(manager.fetchModels('openai')).resolves.toEqual({
        models: [],
        error: 'socket hang up',
      })
    })

    it('returns Provider not found for an unknown provider', async () => {
      await expect(manager.fetchModels('missing')).resolves.toEqual({
        models: [],
        error: 'Provider not found',
      })
    })
  })
})
