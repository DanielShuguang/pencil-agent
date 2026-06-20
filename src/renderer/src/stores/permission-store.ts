import { create } from 'zustand'

export interface PermissionConfig {
  mode: 'auto' | 'prompt' | 'smart'
  disabledTools: string[]
  dangerousPatternOverrides: string[]
}

export interface ConfirmRequest {
  id: string
  toolName: string
  parameters: Record<string, unknown>
  riskLevel: 'low' | 'medium' | 'high'
  pattern?: string
}

export interface ConfirmResponse {
  id: string
  allowed: boolean
  rememberSession?: boolean
}

interface PermissionState {
  config: PermissionConfig
  pendingConfirm: ConfirmRequest | null
  isLoaded: boolean

  fetchConfig: () => Promise<void>
  updateConfig: (update: Partial<PermissionConfig>) => Promise<void>
  handleConfirmRequest: (request: ConfirmRequest) => void
  submitConfirmResponse: (response: ConfirmResponse) => void
  dismissConfirm: () => void
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
  config: { mode: 'smart', disabledTools: [], dangerousPatternOverrides: [] },
  pendingConfirm: null,
  isLoaded: false,

  fetchConfig: async () => {
    try {
      const rawConfig = await window.api.permission.getConfig()
      const config: PermissionConfig = {
        mode: (['auto', 'prompt', 'smart'].includes(rawConfig.mode) ? rawConfig.mode : 'smart') as PermissionConfig['mode'],
        disabledTools: rawConfig.disabledTools || [],
        dangerousPatternOverrides: rawConfig.dangerousPatternOverrides || [],
      }
      set({ config, isLoaded: true })
    } catch {
      set({ isLoaded: true })
    }
  },

  updateConfig: async (update) => {
    const newConfig = { ...get().config, ...update }
    set({ config: newConfig })
    try {
      await window.api.permission.setConfig(newConfig as Record<string, unknown>)
    } catch (error) {
      console.error('Failed to update permission config:', error)
    }
  },

  handleConfirmRequest: (request) => {
    set({ pendingConfirm: request })
  },

  submitConfirmResponse: (response) => {
    void window.api.permission.submitConfirmResponse(response as unknown as Record<string, unknown>)
    set({ pendingConfirm: null })
  },

  dismissConfirm: () => {
    const { pendingConfirm } = get()
    if (pendingConfirm) {
      // 默认拒绝
      void window.api.permission.submitConfirmResponse({
        id: pendingConfirm.id,
        allowed: false,
      } as unknown as Record<string, unknown>)
      set({ pendingConfirm: null })
    }
  },
}))
