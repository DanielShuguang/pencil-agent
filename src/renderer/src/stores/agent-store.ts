import { create } from 'zustand'
import type { AgentChunk, AgentToolCall, TokenUsage } from '@shared/ipc'
import { getStorageItem, setStorageItem, removeStorageItem } from '../lib/storage'
import i18n from '../i18n'

// 每个会话最大消息数，超出后自动截断最早的消息
const MAX_MESSAGES_PER_SESSION = 100

// 消息类型定义
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  toolCall?: AgentToolCall
  timestamp: number
}

// 会话元数据
export interface SessionMeta {
  id: string
  title: string
  model: { id: string; provider: string }
  createdAt: number
  updatedAt: number
  messageCount: number
  parentSessionId?: string  // 父会话 ID（分支功能）
  branchPointMessageId?: string  // 分支点消息 ID
}

// Agent 状态接口
interface AgentState {
  sessions: Map<string, Message[]>
  sessionMetas: Map<string, SessionMeta>
  activeSessionId: string | null
  isGenerating: boolean
  currentModel: { id: string; provider: string }
  language: 'zh' | 'en'

  initFromStorage: () => void
  createSession: () => Promise<string>
  deleteSession: (id: string) => void
  sendMessage: (content: string) => void
  stopGeneration: () => void
  switchSession: (id: string) => void
  appendChunk: (chunk: AgentChunk) => void
  switchModel: (model: { id: string; provider: string }) => void
  createBranch: (messageId: string) => Promise<string | null>
  getBranches: () => SessionMeta[]
  setLanguage: (lang: 'zh' | 'en') => void
}

// 持久化会话到本地存储
function persistSession(meta: SessionMeta, messages: Message[]): void {
  setStorageItem(`session:${meta.id}`, { meta, messages })
}

// 从本地存储删除会话
function persistRemoveSession(id: string): void {
  removeStorageItem(`session:${id}`)
}

// 截断消息列表，保持在最大限制内
function truncateMessages(messages: Message[]): Message[] {
  if (messages.length <= MAX_MESSAGES_PER_SESSION) return messages
  return messages.slice(-MAX_MESSAGES_PER_SESSION)
}

// 处理工具调用块：创建新的工具调用消息
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

// 处理工具结果块：更新对应工具调用的状态
function handleToolResultChunk(chunk: AgentChunk, prev: Message[]): Message[] {
  // 查找最后一个正在运行的工具调用
  const index = prev.findLastIndex((m) => m.toolCall?.status === 'running')
  if (index === -1) return prev

  const target = prev[index]
  return [
    ...prev.slice(0, index),
    {
      ...target,
      toolCall: {
        ...target.toolCall!,
        // 根据是否有错误设置状态
        status: chunk.metadata?.error ? ('error' as const) : ('success' as const),
        ...(chunk.metadata?.error
          ? { error: chunk.metadata.error as string }
          : { result: chunk.content }),
      },
    },
    ...prev.slice(index + 1),
  ]
}

// 处理文本块：追加到现有消息或创建新消息
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
  language: getStorageItem<'zh' | 'en'>('language', 'zh'),

  initFromStorage: () => {
    const savedSessions = getStorageItem<string[]>('sessionIds', [])
    const sessions = new Map<string, Message[]>()
    const sessionMetas = new Map<string, SessionMeta>()
    const lastActiveId = getStorageItem<string | null>('activeSessionId', null)

    for (const id of savedSessions) {
      const data = getStorageItem<{ meta: SessionMeta; messages: Message[] } | null>(
        `session:${id}`,
        null,
      )
      if (data) {
        sessions.set(id, data.messages)
        sessionMetas.set(id, data.meta)
      }
    }

    const activeSessionId =
      lastActiveId && sessions.has(lastActiveId) ? lastActiveId : savedSessions[0] || null

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
      title: i18n.t('app.newConversation'),
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

    if (chunk.metadata?.tokenUsage) {
      const usage = chunk.metadata.tokenUsage as Partial<TokenUsage>
      window.dispatchEvent(new CustomEvent('token-usage', { detail: usage }))
    }

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

  createBranch: async (messageId: string) => {
    const { activeSessionId, sessions, sessionMetas, currentModel } = get()
    if (!activeSessionId) return null

    const messages = sessions.get(activeSessionId) || []
    const branchIndex = messages.findIndex((m) => m.id === messageId)
    if (branchIndex === -1) return null

    const branchMessages = messages.slice(0, branchIndex + 1)
    const branchId = `branch-${Date.now()}`

    await window.api.agent.create({
      sessionId: branchId,
      model: currentModel,
    })

    const meta: SessionMeta = {
      id: branchId,
      title: i18n.t('app.branchTitle', {
        title: sessionMetas.get(activeSessionId)?.title || i18n.t('app.newConversation'),
      }),
      model: currentModel,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: branchMessages.length,
      parentSessionId: activeSessionId,
      branchPointMessageId: messageId,
    }

    const newSessions = new Map(sessions)
    const newMetas = new Map(sessionMetas)
    newSessions.set(branchId, branchMessages)
    newMetas.set(branchId, meta)

    setStorageItem('sessionIds', Array.from(newSessions.keys()))
    setStorageItem('activeSessionId', branchId)
    persistSession(meta, branchMessages)

    set({ sessions: newSessions, sessionMetas: newMetas, activeSessionId: branchId })
    return branchId
  },

  getBranches: () => {
    const { activeSessionId, sessionMetas } = get()
    if (!activeSessionId) return []

    return Array.from(sessionMetas.values()).filter(
      (meta) => meta.parentSessionId === activeSessionId,
    )
  },

  setLanguage: (lang: 'zh' | 'en') => {
    setStorageItem('language', lang)
    i18n.changeLanguage(lang)
    set({ language: lang })
  },
}))
