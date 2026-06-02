import { create } from 'zustand'
import type { AgentChunk, AgentToolCall } from '@shared/ipc'
import { getStorageItem, setStorageItem, removeStorageItem } from '../lib/storage'

const MAX_MESSAGES_PER_SESSION = 100

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  toolCall?: AgentToolCall
  timestamp: number
}

export interface SessionMeta {
  id: string
  title: string
  model: { id: string; provider: string }
  createdAt: number
  updatedAt: number
  messageCount: number
}

interface AgentState {
  sessions: Map<string, Message[]>
  sessionMetas: Map<string, SessionMeta>
  activeSessionId: string | null
  isGenerating: boolean
  currentModel: { id: string; provider: string }

  initFromStorage: () => void
  createSession: () => Promise<string>
  deleteSession: (id: string) => void
  sendMessage: (content: string) => void
  stopGeneration: () => void
  switchSession: (id: string) => void
  appendChunk: (chunk: AgentChunk) => void
  switchModel: (model: { id: string; provider: string }) => void
}

function persistSession(meta: SessionMeta, messages: Message[]): void {
  setStorageItem(`session:${meta.id}`, { meta, messages })
}

function persistRemoveSession(id: string): void {
  removeStorageItem(`session:${id}`)
}

function truncateMessages(messages: Message[]): Message[] {
  if (messages.length <= MAX_MESSAGES_PER_SESSION) return messages
  return messages.slice(-MAX_MESSAGES_PER_SESSION)
}

function handleToolCallChunk(chunk: AgentChunk, prev: Message[]): Message[] {
  return [
    ...prev,
    {
      id: `msg-${Date.now()}`,
      role: 'assistant' as const,
      content: '',
      toolCall: {
        toolName: (chunk.metadata?.toolName as string) || 'unknown',
        parameters: (chunk.metadata?.parameters as Record<string, unknown>) || {},
        status: 'running' as const,
      },
      timestamp: Date.now(),
    },
  ]
}

function handleToolResultChunk(chunk: AgentChunk, prev: Message[]): Message[] {
  const index = prev.findLastIndex((m) => m.toolCall?.status === 'running')
  if (index === -1) return prev

  const target = prev[index]
  return [
    ...prev.slice(0, index),
    {
      ...target,
      toolCall: {
        ...target.toolCall!,
        status: chunk.metadata?.error ? ('error' as const) : ('success' as const),
        ...(chunk.metadata?.error ? { error: chunk.metadata.error as string } : { result: chunk.content }),
      },
    },
    ...prev.slice(index + 1),
  ]
}

function handleTextChunk(chunk: AgentChunk, prev: Message[]): Message[] {
  if (prev.length > 0) {
    const last = prev[prev.length - 1]
    if (last.role === 'assistant' && !last.toolCall) {
      return [...prev.slice(0, -1), { ...last, content: last.content + chunk.content }]
    }
  }
  return [
    ...prev,
    {
      id: `msg-${Date.now()}`,
      role: 'assistant' as const,
      content: chunk.content,
      timestamp: Date.now(),
    },
  ]
}

function updateMessageMeta(meta: SessionMeta, messages: Message[]): SessionMeta {
  return { ...meta, updatedAt: Date.now(), messageCount: messages.length }
}

export const useAgentStore = create<AgentState>((set, get) => ({
  sessions: new Map(),
  sessionMetas: new Map(),
  activeSessionId: null,
  isGenerating: false,
  currentModel: getStorageItem<{ id: string; provider: string }>('currentModel', {
    id: 'claude-sonnet-4-20250514',
    provider: 'anthropic',
  }),

  initFromStorage: () => {
    const savedSessions = getStorageItem<string[]>('sessionIds', [])
    const sessions = new Map<string, Message[]>()
    const sessionMetas = new Map<string, SessionMeta>()
    const lastActiveId = getStorageItem<string | null>('activeSessionId', null)

    for (const id of savedSessions) {
      const data = getStorageItem<{ meta: SessionMeta; messages: Message[] } | null>(`session:${id}`, null)
      if (data) {
        sessions.set(id, data.messages)
        sessionMetas.set(id, data.meta)
      }
    }

    const activeSessionId = lastActiveId && sessions.has(lastActiveId) ? lastActiveId : savedSessions[0] || null

    set({ sessions, sessionMetas, activeSessionId })
  },

  createSession: async () => {
    const { currentModel } = get()
    const id = `session-${Date.now()}`
    await window.api.agent.create({
      sessionId: id,
      model: currentModel,
    })

    const meta: SessionMeta = {
      id,
      title: 'New Chat',
      model: currentModel,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 0,
    }

    const sessions = new Map(get().sessions)
    const sessionMetas = new Map(get().sessionMetas)
    sessions.set(id, [])
    sessionMetas.set(id, meta)

    setStorageItem('sessionIds', Array.from(sessions.keys()))
    setStorageItem('activeSessionId', id)
    persistSession(meta, [])

    set({ sessions, sessionMetas, activeSessionId: id })
    return id
  },

  deleteSession: (id: string) => {
    const sessions = new Map(get().sessions)
    const sessionMetas = new Map(get().sessionMetas)
    sessions.delete(id)
    sessionMetas.delete(id)

    const sessionIds = Array.from(sessions.keys())
    setStorageItem('sessionIds', sessionIds)
    persistRemoveSession(id)

    let activeSessionId = get().activeSessionId
    if (activeSessionId === id) {
      activeSessionId = sessionIds[0] || null
      setStorageItem('activeSessionId', activeSessionId)
    }

    set({ sessions, sessionMetas, activeSessionId })
  },

  sendMessage: (content: string) => {
    const { activeSessionId } = get()
    if (!activeSessionId) return

    const sessions = new Map(get().sessions)
    const metas = new Map(get().sessionMetas)
    const prev = sessions.get(activeSessionId) || []
    const newMessages = [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        role: 'user' as const,
        content,
        timestamp: Date.now(),
      },
    ]

    const truncatedMessages = truncateMessages(newMessages)
    sessions.set(activeSessionId, truncatedMessages)

    const meta = metas.get(activeSessionId)
    if (meta) {
      const updatedMeta = {
        ...meta,
        title: prev.length === 0 ? content.slice(0, 30) : meta.title,
        updatedAt: Date.now(),
        messageCount: truncatedMessages.length,
      }
      metas.set(activeSessionId, updatedMeta)
      persistSession(updatedMeta, truncatedMessages)
    }

    set({ sessions, sessionMetas: metas, isGenerating: true })
    window.api.agent.prompt(activeSessionId, content)
  },

  appendChunk: (chunk: AgentChunk) => {
    const { activeSessionId } = get()
    if (!activeSessionId) return

    const sessions = new Map(get().sessions)
    const metas = new Map(get().sessionMetas)
    const prev = sessions.get(activeSessionId) || []

    let newMessages: Message[]

    if (chunk.type === 'tool_call') {
      newMessages = handleToolCallChunk(chunk, prev)
    } else if (chunk.type === 'tool_result') {
      newMessages = handleToolResultChunk(chunk, prev)
    } else if (chunk.type === 'text') {
      newMessages = handleTextChunk(chunk, prev)
    } else {
      newMessages = prev
    }

    newMessages = truncateMessages(newMessages)
    sessions.set(activeSessionId, newMessages)

    const meta = metas.get(activeSessionId)
    if (meta) {
      const updatedMeta = updateMessageMeta(meta, newMessages)
      metas.set(activeSessionId, updatedMeta)
      persistSession(updatedMeta, newMessages)
    }

    set({ sessions, sessionMetas: metas })
  },

  stopGeneration: () => {
    const { activeSessionId } = get()
    if (activeSessionId) {
      window.api.agent.stop(activeSessionId)
    }
    set({ isGenerating: false })
  },

  switchSession: (id: string) => {
    setStorageItem('activeSessionId', id)
    set({ activeSessionId: id })
  },

  switchModel: (model: { id: string; provider: string }) => {
    setStorageItem('currentModel', model)
    set({ currentModel: model })
  },
}))
