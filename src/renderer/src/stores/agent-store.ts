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
      const prev = sessions.get(activeSessionId) || []
      sessions.set(activeSessionId, [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: 'user',
          content,
          timestamp: Date.now(),
        },
      ])
      return { sessions, isGenerating: true }
    })

    window.api.agent.prompt(activeSessionId, content)
  },

  appendChunk: (chunk: AgentChunk) => {
    const { activeSessionId } = get()
    if (!activeSessionId) return

    set((state) => {
      const sessions = new Map(state.sessions)
      const prev = sessions.get(activeSessionId) || []

      let newMessages: Message[]

      if (chunk.type === 'tool_call') {
        newMessages = [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: '',
            toolCall: {
              toolName: chunk.metadata?.toolName as string || 'unknown',
              parameters: (chunk.metadata?.parameters as Record<string, unknown>) || {},
              status: 'running',
            },
            timestamp: Date.now(),
          },
        ]
      } else if (chunk.type === 'tool_result') {
        const index = prev.findLastIndex(
          (m) => m.toolCall?.status === 'running'
        )
        if (index === -1) {
          newMessages = prev
        } else {
          const target = prev[index]
          newMessages = [
            ...prev.slice(0, index),
            {
              ...target,
              toolCall: {
                ...target.toolCall!,
                status: chunk.metadata?.error ? 'error' : 'success',
                ...(chunk.metadata?.error
                  ? { error: chunk.metadata.error as string }
                  : { result: chunk.content }),
              },
            },
            ...prev.slice(index + 1),
          ]
        }
      } else if (prev.length > 0) {
        const last = prev[prev.length - 1]
        if (last?.role === 'assistant' && chunk.type === 'text' && !last.toolCall) {
          newMessages = [
            ...prev.slice(0, -1),
            { ...last, content: last.content + chunk.content },
          ]
        } else if (chunk.type === 'text') {
          newMessages = [
            ...prev,
            {
              id: `msg-${Date.now()}`,
              role: 'assistant',
              content: chunk.content,
              timestamp: Date.now(),
            },
          ]
        } else {
          newMessages = prev
        }
      } else if (chunk.type === 'text') {
        newMessages = [
          {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: chunk.content,
            timestamp: Date.now(),
          },
        ]
      } else {
        newMessages = prev
      }

      sessions.set(activeSessionId, newMessages)
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
