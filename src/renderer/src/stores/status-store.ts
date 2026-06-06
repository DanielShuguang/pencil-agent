import { create } from 'zustand'
import type { ConnectionStatus, TokenUsage } from '@shared/ipc'

let tokenListenerInitialized = false
let connectionTimer: ReturnType<typeof setInterval> | null = null

interface StatusState {
  currentModel: { id: string; provider: string }
  tokenUsage: TokenUsage
  connectionStatus: ConnectionStatus
  lastChecked: number
  version: string
  isGenerating: boolean

  incrementTokenUsage: (usage: Partial<TokenUsage>) => void
  resetTokenUsage: () => void
  checkConnection: () => Promise<void>
  syncFromAgentStore: (model: { id: string; provider: string }, isGenerating: boolean) => void
  init: () => Promise<void>
}

export const useStatusStore = create<StatusState>((set, get) => ({
  currentModel: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
  tokenUsage: { prompt: 0, completion: 0, total: 0 },
  connectionStatus: 'checking' as ConnectionStatus,
  lastChecked: 0,
  version: '0.0.0',
  isGenerating: false,

  incrementTokenUsage: (usage: Partial<TokenUsage>) => {
    set((state) => {
      const newTokenUsage = {
        prompt: state.tokenUsage.prompt + (usage.prompt || 0),
        completion: state.tokenUsage.completion + (usage.completion || 0),
        total: state.tokenUsage.total + (usage.total || 0),
      }
      return { tokenUsage: newTokenUsage }
    })
  },

  resetTokenUsage: () => {
    set({ tokenUsage: { prompt: 0, completion: 0, total: 0 } })
  },

  checkConnection: async () => {
    const { currentModel } = get()
    set({ connectionStatus: 'checking' })

    try {
      const isConnected = await window.api.settings.checkConnection(currentModel.provider)
      set({
        connectionStatus: isConnected ? 'connected' : 'disconnected',
        lastChecked: Date.now(),
      })
    } catch (error) {
      console.error('Connection check failed:', error)
      set({
        connectionStatus: 'disconnected',
        lastChecked: Date.now(),
      })
    }
  },

  syncFromAgentStore: (model: { id: string; provider: string }, isGenerating: boolean) => {
    const { currentModel } = get()
    if (currentModel.id !== model.id || currentModel.provider !== model.provider) {
      set({ currentModel: model })
      // 模型变化后重新检查连接状态
      get().checkConnection()
    }
    set({ isGenerating })
  },

  init: async () => {
    try {
      const version = await window.api.app.getVersion()
      set({ version })
    } catch (error) {
      console.error('Failed to get version:', error)
    }

    const { checkConnection, incrementTokenUsage } = get()
    await checkConnection()

    if (typeof window !== 'undefined' && window.addEventListener && !tokenListenerInitialized) {
      tokenListenerInitialized = true
      window.addEventListener('token-usage', ((e: CustomEvent<Partial<TokenUsage>>) => {
        incrementTokenUsage(e.detail)
      }) as EventListener)
    }

    if (connectionTimer) clearInterval(connectionTimer)
    connectionTimer = setInterval(() => {
      checkConnection()
    }, 60000)
  },
}))
