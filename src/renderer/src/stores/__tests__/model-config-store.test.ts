import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useModelConfigStore } from '../model-config-store'

vi.stubGlobal('window', {
  api: {
    modelConfig: {
      list: vi.fn().mockResolvedValue([]),
      save: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      saveModel: vi.fn().mockResolvedValue(undefined),
      deleteModel: vi.fn().mockResolvedValue(undefined),
      testConnection: vi.fn().mockResolvedValue({ success: true }),
    },
  },
})

describe('model-config-store', () => {
  beforeEach(() => {
    useModelConfigStore.setState({
      providers: [],
      isLoading: false,
      error: null,
    })
  })

  describe('fetchProviders', () => {
    it('should fetch providers', async () => {
      const mockProviders = [
        {
          id: 'test',
          name: 'Test',
          baseUrl: 'https://api.test.com/v1',
          apiFormat: 'openai' as const,
          models: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      vi.mocked(window.api.modelConfig.list).mockResolvedValueOnce(mockProviders)

      const { fetchProviders } = useModelConfigStore.getState()
      await fetchProviders()

      const { providers } = useModelConfigStore.getState()
      expect(providers).toEqual(mockProviders)
    })

    it('should handle fetch error', async () => {
      vi.mocked(window.api.modelConfig.list).mockRejectedValueOnce(new Error('Network error'))

      const { fetchProviders } = useModelConfigStore.getState()
      await fetchProviders()

      const { error } = useModelConfigStore.getState()
      expect(error).toBe('Network error')
    })
  })

  describe('saveProvider', () => {
    it('should save provider', async () => {
      const { saveProvider } = useModelConfigStore.getState()

      await saveProvider({
        id: 'test',
        name: 'Test',
        baseUrl: 'https://api.test.com/v1',
        apiKey: 'sk-test',
        apiFormat: 'openai',
        models: [],
      })

      expect(window.api.modelConfig.save).toHaveBeenCalled()
    })
  })

  describe('deleteProvider', () => {
    it('should delete provider', async () => {
      const { deleteProvider } = useModelConfigStore.getState()

      await deleteProvider('test')

      expect(window.api.modelConfig.delete).toHaveBeenCalledWith('test')
    })
  })

  describe('testConnection', () => {
    it('should test connection', async () => {
      const { testConnection } = useModelConfigStore.getState()

      const result = await testConnection('test')

      expect(result.success).toBe(true)
      expect(window.api.modelConfig.testConnection).toHaveBeenCalledWith({ providerId: 'test' })
    })

    it('should handle test failure', async () => {
      vi.mocked(window.api.modelConfig.testConnection).mockResolvedValueOnce({
        success: false,
        error: 'Invalid API key',
      })

      const { testConnection } = useModelConfigStore.getState()

      const result = await testConnection('test')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid API key')
    })
  })
})
