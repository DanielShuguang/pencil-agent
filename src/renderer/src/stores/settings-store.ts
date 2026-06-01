import { create } from 'zustand'

interface SettingsState {
  theme: 'light' | 'dark' | 'system'
  language: string
  apiKeys: Record<string, string>

  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setLanguage: (language: string) => void
  setApiKey: (provider: string, key: string) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'system',
  language: 'zh-CN',
  apiKeys: {},

  setTheme: (theme) => set({ theme }),
  setLanguage: (language) => set({ language }),
  setApiKey: (provider, key) =>
    set((state) => ({ apiKeys: { ...state.apiKeys, [provider]: key } })),
}))
