import { create } from 'zustand'
import { flushSync } from 'react-dom'
import type { AgentChunk, AgentToolCall, TokenUsage } from '@shared/ipc'
import { getStorageItem, setStorageItem, removeStorageItem } from '../lib/storage'
import { useEditorStore, getLanguageFromPath } from './editor-store'
import { useSandboxStore } from './sandbox-store'
import i18n from '../i18n'

// 生成唯一 ID，避免同一毫秒内冲突
function createIdGenerator(prefix: string) {
  let counter = 0
  return () => {
    counter = (counter + 1) % 10000
    return `${prefix}-${Date.now()}-${counter}-${Math.random().toString(36).slice(2, 7)}`
  }
}

const generateMessageId = createIdGenerator('msg')
const generateToolCallId = createIdGenerator('tc')

// 每个会话最大消息数，超出后智能截断
const MAX_MESSAGES_PER_SESSION = 300

// 截断消息列表：保留开头的 system 消息和所有 user 消息，只丢弃最早的 assistant/tool 消息
function truncateMessages(messages: Message[]): Message[] {
  if (messages.length <= MAX_MESSAGES_PER_SESSION) return messages
  const excess = messages.length - MAX_MESSAGES_PER_SESSION
  // 找到开头 system 消息的结束位置
  let leadingSystemEnd = 0
  while (leadingSystemEnd < messages.length && messages[leadingSystemEnd].role === 'system') {
    leadingSystemEnd++
  }
  // 从 system 消息之后开始，收集可丢弃的 assistant/tool 消息索引
  const droppable: number[] = []
  for (let i = leadingSystemEnd; i < messages.length; i++) {
    if (messages[i].role !== 'user' && messages[i].role !== 'system') {
      droppable.push(i)
    }
    if (droppable.length >= excess) break
  }
  if (droppable.length < excess) return messages.slice(-MAX_MESSAGES_PER_SESSION)
  const cutIndex = droppable[droppable.length - 1] + 1
  return [...messages.slice(0, leadingSystemEnd), ...messages.slice(cutIndex)]
}

// 消息类型定义
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  toolCall?: AgentToolCall
  thinkingContent?: string
  timestamp: number
}

// 会话元数据
export interface SessionMeta {
  id: string
  title: string
  model: { id: string; provider: string }  // 创建时的模型（历史记录）
  currentModel: { id: string; provider: string }  // 当前使用的模型
  cwd?: string
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
  defaultModel: { id: string; provider: string }  // 全局默认模型
  language: 'zh' | 'en'

  initFromStorage: () => void
  syncModelWithProviders: () => Promise<void>
  createSession: (cwd: string) => Promise<string>
  deleteSession: (id: string) => void
  sendMessage: (content: string) => void
  stopGeneration: () => void
  switchSession: (id: string) => void
  validateAndSwitchSession: (id: string) => Promise<boolean>
  appendChunk: (chunk: AgentChunk) => void
  switchSessionModel: (model: { id: string; provider: string }) => void
  switchDefaultModel: (model: { id: string; provider: string }) => void
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

// 处理工具调用块：创建新的工具调用消息
function handleToolCallChunk(chunk: AgentChunk, prev: Message[]): Message[] {
  const toolCallId = generateToolCallId()
  return [
    ...prev,
    {
      id: generateMessageId(),
      role: 'assistant' as const,
      content: '',
      toolCall: {
        id: toolCallId,
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
  const toolCallId = chunk.metadata?.toolCallId as string | undefined
  
  // 优先使用 toolCallId 精确匹配，回退到最后一个 running 状态
  let index = -1
  if (toolCallId) {
    index = prev.findLastIndex((m) => m.toolCall?.id === toolCallId)
  }
  if (index === -1) {
    index = prev.findLastIndex((m) => m.toolCall?.status === 'running')
  }
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
      id: generateMessageId(),
      role: 'assistant' as const,
      content: chunk.content,
      timestamp: Date.now(),
    },
  ]
}

// 处理思考块：追加到现有助手消息的 thinkingContent
function handleThinkingChunk(chunk: AgentChunk, prev: Message[]): Message[] {
  if (prev.length > 0) {
    const last = prev[prev.length - 1]
    if (last.role === 'assistant') {
      return [
        ...prev.slice(0, -1),
        { ...last, thinkingContent: (last.thinkingContent || '') + chunk.content },
      ]
    }
  }
  // 没有现成助手消息时，创建一个仅含思考内容的占位消息
  return [
    ...prev,
    {
      id: generateMessageId(),
      role: 'assistant' as const,
      content: '',
      thinkingContent: chunk.content,
      timestamp: Date.now(),
    },
  ]
}

function updateMessageMeta(meta: SessionMeta, messages: Message[]): SessionMeta {
  return { ...meta, updatedAt: Date.now(), messageCount: messages.length }
}

// 处理上下文压缩事件：插入系统消息提示用户
function handleCompactionChunk(chunk: AgentChunk, prev: Message[]): Message[] {
  const reason = chunk.metadata?.reason === 'overflow' ? '上下文溢出' : '上下文接近上限'
  const summary = chunk.content
    ? `上下文已压缩（${reason}）。摘要：${chunk.content.slice(0, 200)}${chunk.content.length > 200 ? '...' : ''}`
    : `上下文已压缩（${reason}）`
  return [
    ...prev,
    {
      id: generateMessageId(),
      role: 'system' as const,
      content: summary,
      timestamp: Date.now(),
    },
  ]
}

export const useAgentStore = create<AgentState>((set, get) => ({
  sessions: new Map(),
  sessionMetas: new Map(),
  activeSessionId: null,
  isGenerating: false,
  defaultModel: getStorageItem<{ id: string; provider: string }>('defaultModel', {
    id: 'claude-sonnet-4-20250514',
    provider: 'anthropic',
  }),
  language: getStorageItem<'zh' | 'en'>('language', 'zh'),

  initFromStorage: () => {
    try {
      const savedSessions = getStorageItem<string[]>('sessionIds', [])
      const sessions = new Map<string, Message[]>()
      const sessionMetas = new Map<string, SessionMeta>()
      const lastActiveId = getStorageItem<string | null>('activeSessionId', null)

      for (const id of savedSessions) {
        try {
          const data = getStorageItem<{ meta: SessionMeta; messages: Message[] } | null>(
            `session:${id}`,
            null,
          )
          // 验证数据结构完整性
          if (data && data.meta && Array.isArray(data.messages)) {
            // 验证消息格式
            const validMessages = data.messages.filter(
              (m) => m && typeof m.id === 'string' && typeof m.role === 'string' && typeof m.content === 'string',
            )
            sessions.set(id, validMessages)
            sessionMetas.set(id, data.meta)
          }
        } catch (err) {
          console.warn(`Failed to load session ${id}:`, err)
          // 单个会话加载失败不影响其他会话
        }
      }

      const activeSessionId =
        lastActiveId && sessions.has(lastActiveId) ? lastActiveId : savedSessions[0] || null

      set({ sessions, sessionMetas, activeSessionId })
    } catch (err) {
      console.error('Failed to init from storage:', err)
      // 存储完全损坏时，使用空状态
      set({ sessions: new Map(), sessionMetas: new Map(), activeSessionId: null })
    }
  },

  // 检查当前模型的 provider 是否有配置，没有则自动切换到第一个可用的
  syncModelWithProviders: async () => {
    const { defaultModel } = get()
    try {
      const providers = await window.api.modelConfig.list()
      if (providers.length === 0) return

      const hasCurrentProvider = providers.some((p) => p.id === defaultModel.provider)
      if (!hasCurrentProvider) {
        const firstProvider = providers[0]
        const firstModel = firstProvider.models[0]
        if (firstModel) {
          const newModel = { id: firstModel.id, provider: firstProvider.id }
          setStorageItem('defaultModel', newModel)
          set({ defaultModel: newModel })
        }
      }
    } catch {
      // 忽略错误，使用当前模型
    }
  },

  createSession: async (cwd: string) => {
    const { defaultModel } = get()

    // 获取上一个会话的 currentModel，如果没有则使用 defaultModel
    const lastSession = Array.from(get().sessionMetas.values())
      .sort((a, b) => b.updatedAt - a.updatedAt)[0]
    const model = lastSession?.currentModel || defaultModel

    const id = `session-${Date.now()}`
    await window.api.agent.create({
      sessionId: id,
      model,
      cwd,
    })

    const meta: SessionMeta = {
      id,
      title: i18n.t('app.newConversation'),
      model,  // 创建时的模型
      currentModel: model,  // 当前使用的模型
      cwd,
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
    const { activeSessionId, sessionMetas } = get()
    if (!activeSessionId) return

    // 使用当前会话的 currentModel
    const meta = sessionMetas.get(activeSessionId)
    if (!meta) return
    const model = meta.currentModel

    const sessions = new Map(get().sessions)
    const metas = new Map(get().sessionMetas)
    const prev = sessions.get(activeSessionId) || []
    const newMessages = [
      ...prev,
      {
        id: generateMessageId(),
        role: 'user' as const,
        content,
        timestamp: Date.now(),
      },
    ]

    const truncatedMessages = truncateMessages(newMessages)
    sessions.set(activeSessionId, truncatedMessages)

    const updatedMeta = {
      ...meta,
      title: prev.length === 0 ? content.slice(0, 30) : meta.title,
      updatedAt: Date.now(),
      messageCount: truncatedMessages.length,
    }
    metas.set(activeSessionId, updatedMeta)
    persistSession(updatedMeta, truncatedMessages)

    set({ sessions, sessionMetas: metas, isGenerating: true })
    window.api.agent.prompt(activeSessionId, content, model)
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
      // bash 工具调用：在终端中启动执行
      if (chunk.metadata?.toolName === 'bash') {
        const command = (chunk.metadata?.parameters as Record<string, unknown>)?.command as string
        if (command) {
          const executionId = (chunk.metadata?.toolCallId as string) || `bash-${Date.now()}`
          useSandboxStore.getState().startExecution(executionId, 'bash', command)
        }
      }
    } else if (chunk.type === 'tool_result') {
      newMessages = handleToolResultChunk(chunk, prev)
      const toolName = chunk.metadata?.toolName as string
      const toolCallId = chunk.metadata?.toolCallId as string | undefined
      const params = chunk.metadata?.parameters as Record<string, unknown> | undefined
      const filePath = params?.path as string | undefined

      // bash 工具结果：同步到终端面板
      if (toolName === 'bash') {
        const sandboxStore = useSandboxStore.getState()
        const executionId = toolCallId || sandboxStore.activeExecutionId
        if (executionId) {
          sandboxStore.setActiveExecution(executionId)
        }
        if (chunk.metadata?.error) {
          sandboxStore.appendOutput({ type: 'stderr', content: chunk.metadata.error as string })
        } else if (chunk.content) {
          sandboxStore.appendOutput({ type: 'stdout', content: chunk.content })
        }
        sandboxStore.appendOutput({ type: 'exit', content: '', exitCode: chunk.metadata?.error ? 1 : 0 })
      }

      if (!chunk.metadata?.error && filePath) {
        if (toolName === 'read' && chunk.content) {
          // read 成功：在编辑器中打开文件
          const language = getLanguageFromPath(filePath)
          useEditorStore.getState().openFile(filePath, chunk.content, language)
        } else if (toolName === 'write' && params?.content) {
          // write 成功：更新编辑器中的文件内容（触发 diff 显示）
          const editorStore = useEditorStore.getState()
          if (editorStore.files.has(filePath)) {
            editorStore.updateFileContent(filePath, params.content as string)
          }
        } else if (toolName === 'edit' && chunk.content) {
          // edit 成功：用结果内容更新编辑器（触发 diff 显示）
          const editorStore = useEditorStore.getState()
          if (editorStore.files.has(filePath)) {
            editorStore.updateFileContent(filePath, chunk.content)
          }
        }
      }
    } else if (chunk.type === 'text') {
      newMessages = handleTextChunk(chunk, prev)
    } else if (chunk.type === 'thinking') {
      newMessages = handleThinkingChunk(chunk, prev)
    } else if (chunk.type === 'error') {
      newMessages = [
        ...prev,
        {
          id: generateMessageId(),
          role: 'system' as const,
          content: chunk.content,
          timestamp: Date.now(),
        },
      ]
    } else if (chunk.type === 'compaction') {
      newMessages = handleCompactionChunk(chunk, prev)
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

    // 使用 flushSync 确保每次 chunk 立即触发渲染
    flushSync(() => {
      set({ sessions, sessionMetas: metas })
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
    setStorageItem('activeSessionId', id)
    set({ activeSessionId: id })
  },

  validateAndSwitchSession: async (id: string) => {
    const meta = get().sessionMetas.get(id)
    if (!meta?.cwd) {
      return false
    }
    // 通过 agent:create 校验路径（会抛出错误如果路径无效）
    try {
      await window.api.agent.create({
        sessionId: id,
        model: meta.model,
        cwd: meta.cwd,
      })
      setStorageItem('activeSessionId', id)
      set({ activeSessionId: id })
      return true
    } catch {
      return false
    }
  },

  switchSessionModel: (model: { id: string; provider: string }) => {
    const { activeSessionId, sessionMetas } = get()
    if (!activeSessionId) return

    const meta = sessionMetas.get(activeSessionId)
    if (!meta) return

    const updatedMeta = { ...meta, currentModel: model, updatedAt: Date.now() }
    const newMetas = new Map(sessionMetas)
    newMetas.set(activeSessionId, updatedMeta)

    // 持久化
    persistSession(updatedMeta, get().sessions.get(activeSessionId) || [])

    set({ sessionMetas: newMetas })
  },

  switchDefaultModel: (model: { id: string; provider: string }) => {
    setStorageItem('defaultModel', model)
    set({ defaultModel: model })
  },

  createBranch: async (messageId: string) => {
    const { activeSessionId, sessions, sessionMetas } = get()
    if (!activeSessionId) return null

    const messages = sessions.get(activeSessionId) || []
    const branchIndex = messages.findIndex((m) => m.id === messageId)
    if (branchIndex === -1) return null

    const branchMessages = messages.slice(0, branchIndex + 1)
    const branchId = `branch-${Date.now()}`
    const parentMeta = sessionMetas.get(activeSessionId)
    const branchCwd = parentMeta?.cwd

    if (!branchCwd) return null

    // 继承父会话的 currentModel
    const model = parentMeta?.currentModel || get().defaultModel

    await window.api.agent.create({
      sessionId: branchId,
      model,
      cwd: branchCwd,
    })

    const meta: SessionMeta = {
      id: branchId,
      title: i18n.t('app.branchTitle', {
        title: sessionMetas.get(activeSessionId)?.title || i18n.t('app.newConversation'),
      }),
      model,  // 创建时的模型
      currentModel: model,  // 当前使用的模型
      cwd: branchCwd,
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
    void i18n.changeLanguage(lang)
    set({ language: lang })
  },
}))
