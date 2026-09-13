import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useModelConfigStore } from '../model-config-store'

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
  saveModel: vi.fn(),
  deleteModel: vi.fn(),
  toggleVisibility: vi.fn(),
  testConnection: vi.fn(),
  fetchModels: vi.fn(),
}))

vi.stubGlobal('window', { api: { modelConfig: mocks } })

const provider = {
  id: 'p1',
  name: 'Provider',
  baseUrl: 'https://api.test.com/v1',
  apiFormat: 'openai' as const,
  models: [],
  createdAt: 1,
  updatedAt: 1,
}

const model = { id: 'm1', name: 'Model', providerId: 'p1' }

function resetMocks() {
  for (const fn of Object.values(mocks)) {
    fn.mockReset()
  }
  mocks.list.mockResolvedValue([provider])
  mocks.save.mockResolvedValue(undefined)
  mocks.delete.mockResolvedValue(undefined)
  mocks.saveModel.mockResolvedValue(undefined)
  mocks.deleteModel.mockResolvedValue(undefined)
  mocks.toggleVisibility.mockResolvedValue(undefined)
  mocks.testConnection.mockResolvedValue({ success: true })
  mocks.fetchModels.mockResolvedValue({ models: [model] })
}

describe('model-config-store 写操作', () => {
  beforeEach(() => {
    resetMocks()
    useModelConfigStore.setState({ providers: [], isLoading: false, error: null })
  })

  describe('saveProvider', () => {
    it('成功后重新拉取列表并结束 loading', async () => {
      await useModelConfigStore.getState().saveProvider({ id: 'p1', name: 'Provider' } as any)

      expect(mocks.save).toHaveBeenCalledWith({ id: 'p1', name: 'Provider' })
      expect(mocks.list).toHaveBeenCalled()
      expect(useModelConfigStore.getState().providers).toEqual([provider])
      expect(useModelConfigStore.getState().isLoading).toBe(false)
    })

    it('失败时记录错误信息并结束 loading', async () => {
      mocks.save.mockRejectedValue(new Error('save failed'))

      await useModelConfigStore.getState().saveProvider({ id: 'p1' } as any)

      expect(useModelConfigStore.getState().error).toBe('save failed')
      expect(useModelConfigStore.getState().isLoading).toBe(false)
    })

    it('非 Error 异常使用默认文案', async () => {
      mocks.save.mockRejectedValue('boom')

      await useModelConfigStore.getState().saveProvider({ id: 'p1' } as any)

      expect(useModelConfigStore.getState().error).toBe('Failed to save provider')
    })
  })

  describe('deleteProvider', () => {
    it('成功后重新拉取列表', async () => {
      await useModelConfigStore.getState().deleteProvider('p1')

      expect(mocks.delete).toHaveBeenCalledWith('p1')
      expect(useModelConfigStore.getState().providers).toEqual([provider])
      expect(useModelConfigStore.getState().isLoading).toBe(false)
    })

    it('失败时记录错误', async () => {
      mocks.delete.mockRejectedValue(new Error('delete failed'))

      await useModelConfigStore.getState().deleteProvider('p1')

      expect(useModelConfigStore.getState().error).toBe('delete failed')
      expect(useModelConfigStore.getState().isLoading).toBe(false)
    })

    it('非 Error 异常使用默认文案', async () => {
      mocks.delete.mockRejectedValue(null)

      await useModelConfigStore.getState().deleteProvider('p1')

      expect(useModelConfigStore.getState().error).toBe('Failed to delete provider')
    })
  })

  describe('saveModel', () => {
    it('成功后重新拉取列表', async () => {
      await useModelConfigStore.getState().saveModel('p1', model)

      expect(mocks.saveModel).toHaveBeenCalledWith('p1', model)
      expect(mocks.list).toHaveBeenCalled()
      expect(useModelConfigStore.getState().isLoading).toBe(false)
    })

    it('失败时记录错误', async () => {
      mocks.saveModel.mockRejectedValue(new Error('save model failed'))

      await useModelConfigStore.getState().saveModel('p1', model)

      expect(useModelConfigStore.getState().error).toBe('save model failed')
      expect(useModelConfigStore.getState().isLoading).toBe(false)
    })

    it('非 Error 异常使用默认文案', async () => {
      mocks.saveModel.mockRejectedValue(undefined)

      await useModelConfigStore.getState().saveModel('p1', model)

      expect(useModelConfigStore.getState().error).toBe('Failed to save model')
    })
  })

  describe('deleteModel', () => {
    it('成功后重新拉取列表', async () => {
      await useModelConfigStore.getState().deleteModel('p1', 'm1')

      expect(mocks.deleteModel).toHaveBeenCalledWith('p1', 'm1')
      expect(useModelConfigStore.getState().providers).toEqual([provider])
      expect(useModelConfigStore.getState().isLoading).toBe(false)
    })

    it('失败时记录错误', async () => {
      mocks.deleteModel.mockRejectedValue(new Error('delete model failed'))

      await useModelConfigStore.getState().deleteModel('p1', 'm1')

      expect(useModelConfigStore.getState().error).toBe('delete model failed')
      expect(useModelConfigStore.getState().isLoading).toBe(false)
    })

    it('非 Error 异常使用默认文案', async () => {
      mocks.deleteModel.mockRejectedValue(42)

      await useModelConfigStore.getState().deleteModel('p1', 'm1')

      expect(useModelConfigStore.getState().error).toBe('Failed to delete model')
    })
  })

  describe('toggleVisibility', () => {
    it('成功后重新拉取列表', async () => {
      await useModelConfigStore.getState().toggleVisibility('p1', 'm1')

      expect(mocks.toggleVisibility).toHaveBeenCalledWith('p1', 'm1')
      expect(useModelConfigStore.getState().providers).toEqual([provider])
    })

    it('失败时记录错误', async () => {
      mocks.toggleVisibility.mockRejectedValue(new Error('toggle failed'))

      await useModelConfigStore.getState().toggleVisibility('p1', 'm1')

      expect(useModelConfigStore.getState().error).toBe('toggle failed')
    })

    it('非 Error 异常使用默认文案', async () => {
      mocks.toggleVisibility.mockRejectedValue({})

      await useModelConfigStore.getState().toggleVisibility('p1', 'm1')

      expect(useModelConfigStore.getState().error).toBe('Failed to toggle visibility')
    })
  })

  describe('testConnection', () => {
    it('透传成功结果', async () => {
      mocks.testConnection.mockResolvedValue({ success: true })

      await expect(useModelConfigStore.getState().testConnection('p1')).resolves.toEqual({
        success: true,
      })
      expect(mocks.testConnection).toHaveBeenCalledWith({ providerId: 'p1' })
    })

    it('异常时返回失败结果', async () => {
      mocks.testConnection.mockRejectedValue(new Error('network down'))

      await expect(useModelConfigStore.getState().testConnection('p1')).resolves.toEqual({
        success: false,
        error: 'network down',
      })
    })

    it('非 Error 异常使用默认文案', async () => {
      mocks.testConnection.mockRejectedValue('nope')

      await expect(useModelConfigStore.getState().testConnection('p1')).resolves.toEqual({
        success: false,
        error: 'Connection test failed',
      })
    })
  })

  describe('fetchModels', () => {
    it('透传模型列表', async () => {
      await expect(useModelConfigStore.getState().fetchModels('p1')).resolves.toEqual({
        models: [model],
      })
      expect(mocks.fetchModels).toHaveBeenCalledWith('p1')
    })

    it('异常时返回空列表与错误', async () => {
      mocks.fetchModels.mockRejectedValue(new Error('fetch failed'))

      await expect(useModelConfigStore.getState().fetchModels('p1')).resolves.toEqual({
        models: [],
        error: 'fetch failed',
      })
    })

    it('非 Error 异常使用默认文案', async () => {
      mocks.fetchModels.mockRejectedValue(0)

      await expect(useModelConfigStore.getState().fetchModels('p1')).resolves.toEqual({
        models: [],
        error: 'Failed to fetch models',
      })
    })
  })
})
