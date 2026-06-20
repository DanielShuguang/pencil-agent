import { create } from 'zustand'
import type { ConnectionStatus, TokenUsage } from '@shared/ipc'

let tokenListenerInitialized = false
let connectionTimer: ReturnType<typeof setInterval> | null = null

interface StatusState {
  tokenUsage: TokenUsage
  connectionStatus: ConnectionStatus
  lastChecked: number
  version: string

  incrementTokenUsage: (usage: Partial<TokenUsage>) => void
  resetTokenUsage: () => void
  checkConnection: () => Promise<void>
  init: () => Promise<void>
}

export const useStatusStore = create<StatusState>((set, get) => ({
  tokenUsage: { prompt: 0, completion: 0, total: 0 },
  connectionStatus: 'checking' as ConnectionStatus,
  lastChecked: 0,
  version: '0.0.0',

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
    set({ connectionStatus: 'checking' })

    try {
      const isConnected = await window.api.settings.checkConnection('anthropic')
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
      void checkConnection()
    }, 60000)
  },
}))
