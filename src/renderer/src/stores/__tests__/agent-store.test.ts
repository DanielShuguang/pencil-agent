import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAgentStore } from '../agent-store'
import i18n from '../../i18n'

const mockOpenFile = vi.fn()
const mockUpdateFileContent = vi.fn()
const mockFiles = new Map()

const mockStartExecution = vi.fn()
const mockSandboxAppendOutput = vi.fn()
const mockSetActiveExecution = vi.fn()

vi.mock('../editor-store', () => ({
  useEditorStore: {
    getState: () => ({
      openFile: mockOpenFile,
      updateFileContent: mockUpdateFileContent,
      files: mockFiles,
    }),
  },
  getLanguageFromPath: (path: string) => {
    if (path.endsWith('.ts')) return 'typescript'
    if (path.endsWith('.js')) return 'javascript'
    return 'plaintext'
  },
}))

vi.mock('../sandbox-store', () => ({
  useSandboxStore: {
    getState: () => ({
      startExecution: mockStartExecution,
      appendOutput: mockSandboxAppendOutput,
      setActiveExecution: mockSetActiveExecution,
      activeExecutionId: null,
    }),
  },
}))

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
  vi.stubGlobal('localStorage', localStorageMock)
  vi.stubGlobal('window', {
    ...window,
    api: {
      agent: {
        create: vi.fn().mockResolvedValue(undefined),
        prompt: vi.fn(),
        stop: vi.fn(),
      },
      dialog: {
        selectDirectory: vi.fn().mockResolvedValue({ canceled: false, filePaths: ['/tmp'] }),
      },
      modelConfig: {
        list: vi.fn().mockResolvedValue([]),
      },
    },
  })
  localStorageMock.clear()
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  mockOpenFile.mockClear()
  mockUpdateFileContent.mockClear()
  mockFiles.clear()
  mockStartExecution.mockClear()
  mockSandboxAppendOutput.mockClear()
  useAgentStore.setState({
    sessions: new Map(),
    sessionMetas: new Map(),
    activeSessionId: null,
    isGenerating: false,
    defaultModel: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
  })
})

describe('agent-store', () => {
  it('default state', () => {
    const state = useAgentStore.getState()
    expect(state.activeSessionId).toBeNull()
    expect(state.isGenerating).toBe(false)
    expect(state.sessions.size).toBe(0)
    expect(state.defaultModel).toEqual({
      id: 'claude-sonnet-4-20250514',
      provider: 'anthropic',
    })
  })

  it('createSession creates a new session and calls window.api.agent.create', async () => {
    const id = await useAgentStore.getState().createSession('/tmp')
    expect(id).toMatch(/^session-\d+$/)
    expect(window.api.agent.create).toHaveBeenCalledWith({
      sessionId: id,
      model: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
      cwd: '/tmp',
    })
    expect(useAgentStore.getState().activeSessionId).toBe(id)
    expect(useAgentStore.getState().sessions.get(id)).toEqual([])
  })

  it('createSession sets the new session as active', async () => {
    await useAgentStore.getState().createSession('/tmp')
    expect(useAgentStore.getState().activeSessionId).toBeTruthy()
  })

  it('sendMessage adds a user message and calls window.api.agent.prompt', () => {
    useAgentStore.setState({
      activeSessionId: 'session-1',
      sessions: new Map([['session-1', []]]),
      sessionMetas: new Map([
        [
          'session-1',
          {
            id: 'session-1',
            title: 'New Chat',
            model: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
            currentModel: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messageCount: 0,
          },
        ],
      ]),
    })
    useAgentStore.getState().sendMessage('Hello')
    const messages = useAgentStore.getState().sessions.get('session-1')!
    expect(messages).toHaveLength(1)
    expect(messages[0].role).toBe('user')
    expect(messages[0].content).toBe('Hello')
    expect(window.api.agent.prompt).toHaveBeenCalledWith('session-1', 'Hello', {
      id: 'claude-sonnet-4-20250514',
      provider: 'anthropic',
    })
  })

  it('sendMessage sets isGenerating to true', () => {
    useAgentStore.setState({
      activeSessionId: 'session-1',
      sessions: new Map([['session-1', []]]),
      sessionMetas: new Map([
        [
          'session-1',
          {
            id: 'session-1',
            title: 'New Chat',
            model: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
            currentModel: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messageCount: 0,
          },
        ],
      ]),
    })
    useAgentStore.getState().sendMessage('Hello')
    expect(useAgentStore.getState().isGenerating).toBe(true)
  })

  it('sendMessage does nothing when no active session', () => {
    useAgentStore.getState().sendMessage('Hello')
    expect(window.api.agent.prompt).not.toHaveBeenCalled()
    expect(useAgentStore.getState().isGenerating).toBe(false)
  })

  it('appendChunk appends text to the last assistant message', () => {
    useAgentStore.setState({
      activeSessionId: 'session-1',
      sessions: new Map([
        [
          'session-1',
          [
            { id: 'msg-1', role: 'user' as const, content: 'Hi', timestamp: Date.now() },
            { id: 'msg-2', role: 'assistant' as const, content: 'Hello', timestamp: Date.now() },
          ],
        ],
      ]),
      sessionMetas: new Map(),
    })
    useAgentStore.getState().appendChunk({ type: 'text', content: ' World' })
    const messages = useAgentStore.getState().sessions.get('session-1')!
    expect(messages).toHaveLength(2)
    expect(messages[1].content).toBe('Hello World')
  })

  it('appendChunk creates a new message when no assistant message exists', () => {
    useAgentStore.setState({
      activeSessionId: 'session-1',
      sessions: new Map([['session-1', []]]),
      sessionMetas: new Map(),
    })
    useAgentStore.getState().appendChunk({ type: 'text', content: 'Hello World' })
    const messages = useAgentStore.getState().sessions.get('session-1')!
    expect(messages).toHaveLength(1)
    expect(messages[0].role).toBe('assistant')
    expect(messages[0].content).toBe('Hello World')
  })

  it('appendChunk does nothing when no active session', () => {
    const initialSessions = useAgentStore.getState().sessions
    useAgentStore.getState().appendChunk({ type: 'text', content: 'Hi' })
    expect(useAgentStore.getState().sessions).toBe(initialSessions)
  })

  it('appendChunk opens file in editor on successful read tool result', () => {
    useAgentStore.setState({
      activeSessionId: 'session-1',
      sessions: new Map([
        [
          'session-1',
          [
            {
              id: 'msg-1',
              role: 'assistant',
              content: '',
              toolCall: {
                id: 'tc-1',
                toolName: 'read',
                parameters: { path: '/src/index.ts' },
                status: 'running',
              },
              timestamp: Date.now(),
            },
          ],
        ],
      ]),
      sessionMetas: new Map(),
    })
    useAgentStore.getState().appendChunk({
      type: 'tool_result',
      content: 'const x = 1',
      metadata: { toolCallId: 'tc-1', toolName: 'read', parameters: { path: '/src/index.ts' } },
    })
    expect(mockOpenFile).toHaveBeenCalledWith('/src/index.ts', 'const x = 1', 'typescript')
  })

  it('appendChunk does not open file in editor on failed read tool result', () => {
    useAgentStore.setState({
      activeSessionId: 'session-1',
      sessions: new Map([
        [
          'session-1',
          [
            {
              id: 'msg-1',
              role: 'assistant',
              content: '',
              toolCall: {
                id: 'tc-2',
                toolName: 'read',
                parameters: { path: '/src/index.ts' },
                status: 'running',
              },
              timestamp: Date.now(),
            },
          ],
        ],
      ]),
      sessionMetas: new Map(),
    })
    useAgentStore.getState().appendChunk({
      type: 'tool_result',
      content: '',
      metadata: {
        toolCallId: 'tc-2',
        toolName: 'read',
        parameters: { path: '/src/index.ts' },
        error: 'File not found',
      },
    })
    expect(mockOpenFile).not.toHaveBeenCalled()
  })

  it('appendChunk updates editor content on successful write tool result', () => {
    mockFiles.set('/src/index.ts', { content: 'old' })
    useAgentStore.setState({
      activeSessionId: 'session-1',
      sessions: new Map([
        [
          'session-1',
          [
            {
              id: 'msg-1',
              role: 'assistant',
              content: '',
              toolCall: {
                id: 'tc-3',
                toolName: 'write',
                parameters: { path: '/src/index.ts', content: 'new content' },
                status: 'running',
              },
              timestamp: Date.now(),
            },
          ],
        ],
      ]),
      sessionMetas: new Map(),
    })
    useAgentStore.getState().appendChunk({
      type: 'tool_result',
      content: '',
      metadata: {
        toolCallId: 'tc-3',
        toolName: 'write',
        parameters: { path: '/src/index.ts', content: 'new content' },
      },
    })
    expect(mockUpdateFileContent).toHaveBeenCalledWith('/src/index.ts', 'new content')
  })

  it('appendChunk starts sandbox execution on bash tool call', () => {
    useAgentStore.setState({
      activeSessionId: 'session-1',
      sessions: new Map([['session-1', []]]),
      sessionMetas: new Map(),
    })
    useAgentStore.getState().appendChunk({
      type: 'tool_call',
      content: '',
      metadata: { toolName: 'bash', parameters: { command: 'ls -la' } },
    })
    expect(mockStartExecution).toHaveBeenCalledWith(
      expect.stringMatching(/^bash-/),
      'bash',
      'ls -la',
    )
  })

  it('appendChunk syncs bash tool result to sandbox store', () => {
    useAgentStore.setState({
      activeSessionId: 'session-1',
      sessions: new Map([
        [
          'session-1',
          [
            {
              id: 'msg-1',
              role: 'assistant',
              content: '',
              toolCall: {
                id: 'tc-4',
                toolName: 'bash',
                parameters: { command: 'echo hi' },
                status: 'running',
              },
              timestamp: Date.now(),
            },
          ],
        ],
      ]),
      sessionMetas: new Map(),
    })
    useAgentStore.getState().appendChunk({
      type: 'tool_result',
      content: 'hi\n',
      metadata: { toolCallId: 'tc-4', toolName: 'bash', parameters: { command: 'echo hi' } },
    })
    expect(mockSandboxAppendOutput).toHaveBeenCalledWith({ type: 'stdout', content: 'hi\n' })
    expect(mockSandboxAppendOutput).toHaveBeenCalledWith({ type: 'exit', content: '', exitCode: 0 })
  })

  it('appendChunk syncs bash tool error to sandbox store', () => {
    useAgentStore.setState({
      activeSessionId: 'session-1',
      sessions: new Map([
        [
          'session-1',
          [
            {
              id: 'msg-1',
              role: 'assistant',
              content: '',
              toolCall: {
                id: 'tc-5',
                toolName: 'bash',
                parameters: { command: 'bad' },
                status: 'running',
              },
              timestamp: Date.now(),
            },
          ],
        ],
      ]),
      sessionMetas: new Map(),
    })
    useAgentStore.getState().appendChunk({
      type: 'tool_result',
      content: '',
      metadata: {
        toolCallId: 'tc-5',
        toolName: 'bash',
        parameters: { command: 'bad' },
        error: 'command not found',
      },
    })
    expect(mockSandboxAppendOutput).toHaveBeenCalledWith({
      type: 'stderr',
      content: 'command not found',
    })
    expect(mockSandboxAppendOutput).toHaveBeenCalledWith({ type: 'exit', content: '', exitCode: 1 })
  })

  it('stopGeneration calls window.api.agent.stop and sets isGenerating false', () => {
    useAgentStore.setState({ activeSessionId: 'session-1', isGenerating: true })
    useAgentStore.getState().stopGeneration()
    expect(window.api.agent.stop).toHaveBeenCalledWith('session-1')
    expect(useAgentStore.getState().isGenerating).toBe(false)
  })

  it('switchSession changes activeSessionId', () => {
    useAgentStore.getState().switchSession('session-2')
    expect(useAgentStore.getState().activeSessionId).toBe('session-2')
  })

  it('switchSessionModel updates session currentModel', async () => {
    await useAgentStore.getState().createSession('/tmp')
    const sessionId = useAgentStore.getState().activeSessionId!
    useAgentStore.getState().switchSessionModel({ id: 'gpt-4o', provider: 'openai' })
    expect(useAgentStore.getState().sessionMetas.get(sessionId)?.currentModel).toEqual({
      id: 'gpt-4o',
      provider: 'openai',
    })
  })

  it('createSession inherits model from last session', async () => {
    await useAgentStore.getState().createSession('/test1')
    useAgentStore.getState().switchSessionModel({ id: 'gpt-4o', provider: 'openai' })

    vi.advanceTimersByTime(100)
    await useAgentStore.getState().createSession('/test2')

    const sessionIds = Array.from(useAgentStore.getState().sessionMetas.keys())
    expect(sessionIds).toHaveLength(2)
    const secondSessionMeta = useAgentStore.getState().sessionMetas.get(sessionIds[1])
    expect(secondSessionMeta?.currentModel).toEqual({ id: 'gpt-4o', provider: 'openai' })
  })

  it('createBranch inherits model from parent session', async () => {
    await useAgentStore.getState().createSession('/tmp')
    const sessionId = useAgentStore.getState().activeSessionId!
    useAgentStore.setState({
      sessions: new Map([
        [
          sessionId,
          [
            { id: 'msg-1', role: 'user' as const, content: 'Hello', timestamp: Date.now() },
            { id: 'msg-2', role: 'assistant' as const, content: 'Hi there', timestamp: Date.now() },
          ],
        ],
      ]),
    })
    useAgentStore.getState().switchSessionModel({ id: 'gpt-4o', provider: 'openai' })

    const branchId = await useAgentStore.getState().createBranch('msg-1')
    expect(branchId).toBeTruthy()

    const branchMeta = useAgentStore.getState().sessionMetas.get(branchId!)
    expect(branchMeta?.currentModel).toEqual({ id: 'gpt-4o', provider: 'openai' })
    expect(branchMeta?.model).toEqual({ id: 'gpt-4o', provider: 'openai' })
  })

  it('deleteSession removes session', async () => {
    await useAgentStore.getState().createSession('/tmp')
    const id = useAgentStore.getState().activeSessionId!
    useAgentStore.getState().deleteSession(id)
    expect(useAgentStore.getState().sessions.has(id)).toBe(false)
    expect(useAgentStore.getState().sessionMetas.has(id)).toBe(false)
  })

  it('deleteSession switches to another session if deleting active', async () => {
    await useAgentStore.getState().createSession('/tmp')
    const firstId = useAgentStore.getState().activeSessionId!
    vi.advanceTimersByTime(100)
    await useAgentStore.getState().createSession('/tmp')
    const secondId = useAgentStore.getState().activeSessionId!

    expect(firstId).not.toBe(secondId)
    useAgentStore.getState().deleteSession(secondId)
    expect(useAgentStore.getState().activeSessionId).toBe(firstId)
  })

  it('initFromStorage loads saved sessions', () => {
    const meta = {
      id: 'session-1',
      title: 'Test Session',
      model: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
      currentModel: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 1,
    }
    localStorageMock.setItem('pencil-agent:sessionIds', JSON.stringify(['session-1']))
    localStorageMock.setItem('pencil-agent:activeSessionId', JSON.stringify('session-1'))
    localStorageMock.setItem(
      'pencil-agent:session:session-1',
      JSON.stringify({
        meta,
        messages: [{ id: 'msg-1', role: 'user', content: 'Hi', timestamp: Date.now() }],
      }),
    )

    useAgentStore.getState().initFromStorage()
    const state = useAgentStore.getState()
    expect(state.activeSessionId).toBe('session-1')
    expect(state.sessions.get('session-1')).toHaveLength(1)
    expect(state.sessionMetas.get('session-1')?.title).toBe('Test Session')
  })

  it('truncateMessages limits messages and preserves user/system messages', () => {
    const messages: Array<{
      id: string
      role: 'user' | 'assistant' | 'system'
      content: string
      timestamp: number
    }> = Array.from({ length: 350 }, (_, i) => ({
      id: `msg-${i}`,
      role: (i % 3 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `Message ${i}`,
      timestamp: Date.now(),
    }))
    messages.unshift({
      id: 'msg-sys',
      role: 'system',
      content: 'System note',
      timestamp: Date.now(),
    })

    useAgentStore.setState({
      activeSessionId: 'session-1',
      sessions: new Map([['session-1', messages]]),
      sessionMetas: new Map([
        [
          'session-1',
          {
            id: 'session-1',
            title: 'Test',
            model: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
            currentModel: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messageCount: 351,
          },
        ],
      ]),
    })

    useAgentStore.getState().appendChunk({ type: 'text', content: 'New' })
    const result = useAgentStore.getState().sessions.get('session-1')!
    expect(result.length).toBeLessThanOrEqual(300)
    // system 消息应被保留
    const systemMsgs = result.filter((m) => m.role === 'system')
    expect(systemMsgs.length).toBeGreaterThanOrEqual(1)
  })

  it('sendMessage updates session title from first message', async () => {
    await useAgentStore.getState().createSession('/tmp')
    const id = useAgentStore.getState().activeSessionId!
    useAgentStore.getState().sendMessage('Hello this is a test message')
    const meta = useAgentStore.getState().sessionMetas.get(id)
    expect(meta?.title).toBe('Hello this is a test message')
  })

  it('setLanguage changes language and persists', () => {
    expect(useAgentStore.getState().language).toBe('zh')
    useAgentStore.getState().setLanguage('en')
    expect(useAgentStore.getState().language).toBe('en')
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'pencil-agent:language',
      JSON.stringify('en'),
    )
  })

  it('setLanguage changes i18n language', () => {
    useAgentStore.getState().setLanguage('en')
    expect(i18n.language).toBe('en')
    useAgentStore.getState().setLanguage('zh')
    expect(i18n.language).toBe('zh')
  })

  it('appendChunk handles thinking chunks by appending to thinkingContent', () => {
    useAgentStore.setState({
      activeSessionId: 'session-1',
      sessions: new Map([
        [
          'session-1',
          [{ id: 'msg-1', role: 'assistant' as const, content: 'Answer', timestamp: Date.now() }],
        ],
      ]),
      sessionMetas: new Map(),
    })
    useAgentStore.getState().appendChunk({ type: 'thinking', content: 'Let me think...' })
    const messages = useAgentStore.getState().sessions.get('session-1')!
    expect(messages).toHaveLength(1)
    expect(messages[0].thinkingContent).toBe('Let me think...')
    expect(messages[0].content).toBe('Answer')
  })

  it('appendChunk accumulates thinking chunks', () => {
    useAgentStore.setState({
      activeSessionId: 'session-1',
      sessions: new Map([
        [
          'session-1',
          [{ id: 'msg-1', role: 'assistant' as const, content: '', timestamp: Date.now() }],
        ],
      ]),
      sessionMetas: new Map(),
    })
    useAgentStore.getState().appendChunk({ type: 'thinking', content: 'Part 1. ' })
    useAgentStore.getState().appendChunk({ type: 'thinking', content: 'Part 2.' })
    const messages = useAgentStore.getState().sessions.get('session-1')!
    expect(messages[0].thinkingContent).toBe('Part 1. Part 2.')
  })

  it('appendChunk creates placeholder message for thinking when no assistant message exists', () => {
    useAgentStore.setState({
      activeSessionId: 'session-1',
      sessions: new Map([['session-1', []]]),
      sessionMetas: new Map(),
    })
    useAgentStore.getState().appendChunk({ type: 'thinking', content: 'Thinking...' })
    const messages = useAgentStore.getState().sessions.get('session-1')!
    expect(messages).toHaveLength(1)
    expect(messages[0].role).toBe('assistant')
    expect(messages[0].content).toBe('')
    expect(messages[0].thinkingContent).toBe('Thinking...')
  })

  it('appendChunk handles error chunks by creating system message', () => {
    useAgentStore.setState({
      activeSessionId: 'session-1',
      sessions: new Map([['session-1', []]]),
      sessionMetas: new Map(),
    })
    useAgentStore.getState().appendChunk({ type: 'error', content: 'Something went wrong' })
    const messages = useAgentStore.getState().sessions.get('session-1')!
    expect(messages).toHaveLength(1)
    expect(messages[0].role).toBe('system')
    expect(messages[0].content).toBe('Something went wrong')
  })

  describe('上下文压缩提示', () => {
    function setActiveSessionWith(messages: unknown[] = []) {
      useAgentStore.setState({
        activeSessionId: 'session-1',
        sessions: new Map([['session-1', messages as never]]),
        sessionMetas: new Map(),
      })
    }

    it('溢出时插入带摘要的系统消息', () => {
      setActiveSessionWith()

      useAgentStore.getState().appendChunk({
        type: 'compaction',
        content: '早前对话的摘要',
        metadata: { reason: 'overflow' },
      })

      const messages = useAgentStore.getState().sessions.get('session-1')!
      expect(messages).toHaveLength(1)
      expect(messages[0].role).toBe('system')
      expect(messages[0].content).toContain('上下文溢出')
      expect(messages[0].content).toContain('早前对话的摘要')
    })

    it('接近上限且无摘要时只提示压缩原因', () => {
      setActiveSessionWith()

      useAgentStore.getState().appendChunk({
        type: 'compaction',
        content: '',
        metadata: { reason: 'threshold' },
      })

      const messages = useAgentStore.getState().sessions.get('session-1')!
      expect(messages[0].content).toBe('上下文已压缩（上下文接近上限）')
    })

    it('超长摘要被截断到 200 字并追加省略号', () => {
      setActiveSessionWith()
      const longSummary = 'x'.repeat(250)

      useAgentStore.getState().appendChunk({
        type: 'compaction',
        content: longSummary,
        metadata: { reason: 'overflow' },
      })

      const content = useAgentStore.getState().sessions.get('session-1')![0].content
      expect(content).toContain('...')
      expect(content.length).toBeLessThan(longSummary.length)
    })
  })

  describe('模型同步与选择', () => {
    it('当前 provider 已配置时保持默认模型', async () => {
      ;(window.api.modelConfig.list as any).mockResolvedValue([
        { id: 'anthropic', models: [{ id: 'claude-sonnet-4-20250514' }] },
      ])

      await useAgentStore.getState().syncModelWithProviders()

      expect(useAgentStore.getState().defaultModel.provider).toBe('anthropic')
    })

    it('当前 provider 缺失时切到第一个可用 provider 的模型', async () => {
      ;(window.api.modelConfig.list as any).mockResolvedValue([
        { id: 'custom', models: [{ id: 'custom-model' }] },
      ])

      await useAgentStore.getState().syncModelWithProviders()

      expect(useAgentStore.getState().defaultModel).toEqual({
        id: 'custom-model',
        provider: 'custom',
      })
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('没有 provider 时保持默认模型', async () => {
      ;(window.api.modelConfig.list as any).mockResolvedValue([])

      await useAgentStore.getState().syncModelWithProviders()

      expect(useAgentStore.getState().defaultModel.provider).toBe('anthropic')
    })

    it('provider 存在但没有模型时保持默认模型', async () => {
      ;(window.api.modelConfig.list as any).mockResolvedValue([{ id: 'custom', models: [] }])

      await useAgentStore.getState().syncModelWithProviders()

      expect(useAgentStore.getState().defaultModel.provider).toBe('anthropic')
    })

    it('list 抛错时静默忽略', async () => {
      ;(window.api.modelConfig.list as any).mockRejectedValue(new Error('ipc down'))

      await expect(useAgentStore.getState().syncModelWithProviders()).resolves.toBeUndefined()
      expect(useAgentStore.getState().defaultModel.provider).toBe('anthropic')
    })

    it('switchDefaultModel 更新并持久化默认模型', () => {
      useAgentStore.getState().switchDefaultModel({ id: 'gpt-4o', provider: 'openai' })

      expect(useAgentStore.getState().defaultModel).toEqual({ id: 'gpt-4o', provider: 'openai' })
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pencil-agent:defaultModel',
        JSON.stringify({ id: 'gpt-4o', provider: 'openai' }),
      )
    })
  })

  describe('会话切换校验', () => {
    it('会话缺少 cwd 时返回 false', async () => {
      useAgentStore.setState({
        sessionMetas: new Map([['s1', { id: 's1', title: 't' } as never]]),
      })

      await expect(useAgentStore.getState().validateAndSwitchSession('s1')).resolves.toBe(false)
    })

    it('未知会话返回 false', async () => {
      await expect(useAgentStore.getState().validateAndSwitchSession('missing')).resolves.toBe(
        false,
      )
    })

    it('cwd 有效时切换并返回 true', async () => {
      useAgentStore.setState({
        sessionMetas: new Map([
          [
            's1',
            {
              id: 's1',
              title: 't',
              cwd: '/workspace/app',
              model: { id: 'm1', provider: 'p1' },
            } as never,
          ],
        ]),
      })

      await expect(useAgentStore.getState().validateAndSwitchSession('s1')).resolves.toBe(true)
      expect(useAgentStore.getState().activeSessionId).toBe('s1')
    })

    it('agent.create 抛错时返回 false 且不切换', async () => {
      ;(window.api.agent.create as any).mockRejectedValue(new Error('工作空间不存在'))
      useAgentStore.setState({
        activeSessionId: 'other',
        sessionMetas: new Map([
          [
            's1',
            {
              id: 's1',
              title: 't',
              cwd: '/missing',
              model: { id: 'm1', provider: 'p1' },
            } as never,
          ],
        ]),
      })

      await expect(useAgentStore.getState().validateAndSwitchSession('s1')).resolves.toBe(false)
      expect(useAgentStore.getState().activeSessionId).toBe('other')
    })
  })

  describe('其他守卫分支', () => {
    it('没有活跃会话时 sendMessage 是空操作', () => {
      useAgentStore.setState({ activeSessionId: null })

      useAgentStore.getState().sendMessage('hello')

      expect(window.api.agent.prompt).not.toHaveBeenCalled()
    })

    it('会话元数据缺失时 sendMessage 不发送', () => {
      useAgentStore.setState({
        activeSessionId: 's1',
        sessions: new Map([['s1', []]]),
        sessionMetas: new Map(),
      })

      useAgentStore.getState().sendMessage('hello')

      expect(window.api.agent.prompt).not.toHaveBeenCalled()
      expect(useAgentStore.getState().sessions.get('s1')).toEqual([])
    })

    it('没有活跃会话时 createBranch 返回 null', async () => {
      useAgentStore.setState({ activeSessionId: null })

      await expect(useAgentStore.getState().createBranch('m1')).resolves.toBeNull()
    })

    it('消息 id 不存在时 createBranch 返回 null', async () => {
      useAgentStore.setState({
        activeSessionId: 's1',
        sessions: new Map([['s1', [{ id: 'm1' } as never]]]),
        sessionMetas: new Map([['s1', { id: 's1' } as never]]),
      })

      await expect(useAgentStore.getState().createBranch('missing')).resolves.toBeNull()
    })

    it('父会话缺少 cwd 时 createBranch 返回 null', async () => {
      useAgentStore.setState({
        activeSessionId: 's1',
        sessions: new Map([['s1', [{ id: 'm1' } as never]]]),
        sessionMetas: new Map([['s1', { id: 's1', title: 't' } as never]]),
      })

      await expect(useAgentStore.getState().createBranch('m1')).resolves.toBeNull()
    })

    it('getBranches 过滤出当前会话的子分支', () => {
      useAgentStore.setState({
        activeSessionId: 'parent',
        sessionMetas: new Map([
          ['parent', { id: 'parent' } as never],
          ['child-1', { id: 'child-1', parentSessionId: 'parent' } as never],
          ['child-2', { id: 'child-2', parentSessionId: 'other' } as never],
        ]),
      })

      const branches = useAgentStore.getState().getBranches()

      expect(branches.map((b) => b.id)).toEqual(['child-1'])
    })

    it('没有活跃会话时 getBranches 返回空数组', () => {
      useAgentStore.setState({ activeSessionId: null })

      expect(useAgentStore.getState().getBranches()).toEqual([])
    })

    it('tool_result 找不到对应工具调用时消息保持不变', () => {
      useAgentStore.setState({
        activeSessionId: 's1',
        sessions: new Map([['s1', []]]),
        sessionMetas: new Map(),
      })

      useAgentStore.getState().appendChunk({
        type: 'tool_result',
        content: 'result',
        metadata: { toolCallId: 'missing' },
      })

      expect(useAgentStore.getState().sessions.get('s1')).toEqual([])
    })

    it('未知 chunk 类型不改变消息', () => {
      useAgentStore.setState({
        activeSessionId: 's1',
        sessions: new Map([['s1', [{ id: 'm1', role: 'user', content: 'hi', timestamp: 1 } as never]]]),
        sessionMetas: new Map(),
      })

      useAgentStore
        .getState()
        .appendChunk({ type: 'unknown' as never, content: 'x' })

      expect(useAgentStore.getState().sessions.get('s1')).toHaveLength(1)
    })
  })

  describe('从存储恢复的容错', () => {
    it('单个会话数据损坏时跳过该会话', () => {
      localStorageMock.setItem('pencil-agent:sessionIds', JSON.stringify(['bad', 'good']))
      localStorageMock.setItem('pencil-agent:session:bad', '{not json')
      localStorageMock.setItem(
        'pencil-agent:session:good',
        JSON.stringify({
          meta: { id: 'good', title: 'Good' },
          messages: [{ id: 'm1', role: 'user', content: 'hi', timestamp: 1 }],
        }),
      )
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

      useAgentStore.getState().initFromStorage()

      const state = useAgentStore.getState()
      expect(state.sessions.has('bad')).toBe(false)
      expect(state.sessions.get('good')).toHaveLength(1)
      warn.mockRestore()
    })

    it('过滤掉结构不完整的消息', () => {
      localStorageMock.setItem('pencil-agent:sessionIds', JSON.stringify(['s1']))
      localStorageMock.setItem(
        'pencil-agent:session:s1',
        JSON.stringify({
          meta: { id: 's1', title: 'S1' },
          messages: [
            { id: 'm1', role: 'user', content: 'ok', timestamp: 1 },
            { id: 'm2', role: 'user' },
            null,
          ],
        }),
      )

      useAgentStore.getState().initFromStorage()

      expect(useAgentStore.getState().sessions.get('s1')).toHaveLength(1)
    })

    it('存储整体损坏时回退到空状态', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {})
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('storage unavailable')
      })

      useAgentStore.getState().initFromStorage()

      const state = useAgentStore.getState()
      expect(state.sessions.size).toBe(0)
      expect(state.activeSessionId).toBeNull()
      error.mockRestore()
    })
  })
})
