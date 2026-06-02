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
        models: [],
      })

      const second = manager.save({
        id: 'openai',
        name: 'OpenAI Updated',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-new',
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
    it('should return success for valid connection', async () => {
      manager.save({
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test',
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

    it('should return error for failed connection', async () => {
      manager.save({
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test',
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
        models: [],
      })

      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

      const result = await manager.testConnection('openai')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
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
})
