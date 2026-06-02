import { create } from 'zustand'

interface SettingsState {
  apiKeys: Record<string, string>

  loadApiKey: (provider: string) => Promise<string | null>
  saveApiKey: (provider: string, key: string) => Promise<void>
  deleteApiKey: (provider: string) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set) => ({
  apiKeys: {},

  loadApiKey: async (provider: string) => {
    try {
      const key = await window.api.settings.getKey(provider)
      set((state) => ({
        apiKeys: { ...state.apiKeys, [provider]: key || '' },
      }))
      return key
    } catch (error) {
      console.error('Failed to load API key:', error)
      return null
    }
  },

  saveApiKey: async (provider: string, key: string) => {
    try {
      await window.api.settings.saveKey(provider, key)
      set((state) => ({
        apiKeys: { ...state.apiKeys, [provider]: key },
      }))
    } catch (error) {
      console.error('Failed to save API key:', error)
      throw error
    }
  },

  deleteApiKey: async (provider: string) => {
    try {
      await window.api.settings.deleteKey(provider)
      set((state) => {
        const apiKeys = { ...state.apiKeys }
        delete apiKeys[provider]
        return { apiKeys }
      })
    } catch (error) {
      console.error('Failed to delete API key:', error)
      throw error
    }
  },
}))
