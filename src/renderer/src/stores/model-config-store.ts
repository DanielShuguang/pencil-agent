import { create } from 'zustand'
import type { ModelProvider, ModelProviderInfo, ModelConfig } from '@shared/ipc'

interface ModelConfigState {
  providers: ModelProviderInfo[]
  isLoading: boolean
  error: string | null

  fetchProviders: () => Promise<void>
  saveProvider: (provider: Omit<ModelProvider, 'createdAt' | 'updatedAt'>) => Promise<void>
  deleteProvider: (providerId: string) => Promise<void>
  saveModel: (providerId: string, model: ModelConfig) => Promise<void>
  deleteModel: (providerId: string, modelId: string) => Promise<void>
  testConnection: (providerId: string) => Promise<{ success: boolean; error?: string }>
}

export const useModelConfigStore = create<ModelConfigState>((set, get) => ({
  providers: [],
  isLoading: false,
  error: null,

  fetchProviders: async () => {
    set({ isLoading: true, error: null })
    try {
      const providers = await window.api.modelConfig.list()
      set({ providers, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch providers',
        isLoading: false,
      })
    }
  },

  saveProvider: async (provider) => {
    set({ isLoading: true, error: null })
    try {
      await window.api.modelConfig.save(provider)
      await get().fetchProviders()
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to save provider',
        isLoading: false,
      })
    }
  },

  deleteProvider: async (providerId) => {
    set({ isLoading: true, error: null })
    try {
      await window.api.modelConfig.delete(providerId)
      await get().fetchProviders()
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete provider',
        isLoading: false,
      })
    }
  },

  saveModel: async (providerId, model) => {
    set({ isLoading: true, error: null })
    try {
      await window.api.modelConfig.saveModel(providerId, model)
      await get().fetchProviders()
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to save model',
        isLoading: false,
      })
    }
  },

  deleteModel: async (providerId, modelId) => {
    set({ isLoading: true, error: null })
    try {
      await window.api.modelConfig.deleteModel(providerId, modelId)
      await get().fetchProviders()
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete model',
        isLoading: false,
      })
    }
  },

  testConnection: async (providerId) => {
    try {
      const result = await window.api.modelConfig.testConnection({ providerId })
      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
      }
    }
  },
}))
