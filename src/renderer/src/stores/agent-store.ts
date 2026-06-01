import { create } from 'zustand'
import type { AgentChunk, AgentToolCall } from '@shared/ipc'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  toolCall?: AgentToolCall
  timestamp: number
}

interface AgentState {
  sessions: Map<string, Message[]>
  activeSessionId: string | null
  isGenerating: boolean
  currentModel: { id: string; provider: string }

  createSession: () => Promise<string>
  sendMessage: (content: string) => void
  stopGeneration: () => void
  switchSession: (id: string) => void
  appendChunk: (chunk: AgentChunk) => void
}

export const useAgentStore = create<AgentState>((set, get) => ({
  sessions: new Map(),
  activeSessionId: null,
  isGenerating: false,
  currentModel: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },

  createSession: async () => {
    const id = `session-${Date.now()}`
    await window.api.agent.create({
      sessionId: id,
      model: get().currentModel,
    })
    set((state) => {
      const sessions = new Map(state.sessions)
      sessions.set(id, [])
      return { sessions, activeSessionId: id }
    })
    return id
  },

  sendMessage: (content: string) => {
    const { activeSessionId } = get()
    if (!activeSessionId) return

    set((state) => {
      const sessions = new Map(state.sessions)
      const messages = sessions.get(activeSessionId) || []
      messages.push({
        id: `msg-${Date.now()}`,
        role: 'user',
        content,
        timestamp: Date.now(),
      })
      sessions.set(activeSessionId, messages)
      return { sessions, isGenerating: true }
    })

    window.api.agent.prompt(activeSessionId, content)
  },

  appendChunk: (chunk: AgentChunk) => {
    const { activeSessionId } = get()
    if (!activeSessionId) return

    set((state) => {
      const sessions = new Map(state.sessions)
      const messages = sessions.get(activeSessionId) || []
      const last = messages[messages.length - 1]

      if (last?.role === 'assistant' && chunk.type === 'text') {
        last.content += chunk.content
      } else {
        messages.push({
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: chunk.content,
          timestamp: Date.now(),
        })
      }
      sessions.set(activeSessionId, messages)
      return { sessions }
    })
  },

  stopGeneration: () => {
    const { activeSessionId } = get()
    if (activeSessionId) {
      window.api.agent.stop(activeSessionId)
    }
    set({ isGenerating: false })
  },

  switchSession: (id: string) => {
    set({ activeSessionId: id })
  },
}))
