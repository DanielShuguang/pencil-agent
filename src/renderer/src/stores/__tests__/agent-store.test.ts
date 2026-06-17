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
        ['session-1', {
          id: 'session-1',
          title: 'New Chat',
          model: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
          currentModel: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messageCount: 0,
        }],
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
      sessions: new Map([['session-1', [
        { id: 'msg-1', role: 'assistant', content: '', toolCall: { id: 'tc-1', toolName: 'read', parameters: { path: '/src/index.ts' }, status: 'running' }, timestamp: Date.now() },
      ]]]),
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
      sessions: new Map([['session-1', [
        { id: 'msg-1', role: 'assistant', content: '', toolCall: { id: 'tc-2', toolName: 'read', parameters: { path: '/src/index.ts' }, status: 'running' }, timestamp: Date.now() },
      ]]]),
      sessionMetas: new Map(),
    })
    useAgentStore.getState().appendChunk({
      type: 'tool_result',
      content: '',
      metadata: { toolCallId: 'tc-2', toolName: 'read', parameters: { path: '/src/index.ts' }, error: 'File not found' },
    })
    expect(mockOpenFile).not.toHaveBeenCalled()
  })

  it('appendChunk updates editor content on successful write tool result', () => {
    mockFiles.set('/src/index.ts', { content: 'old' })
    useAgentStore.setState({
      activeSessionId: 'session-1',
      sessions: new Map([['session-1', [
        { id: 'msg-1', role: 'assistant', content: '', toolCall: { id: 'tc-3', toolName: 'write', parameters: { path: '/src/index.ts', content: 'new content' }, status: 'running' }, timestamp: Date.now() },
      ]]]),
      sessionMetas: new Map(),
    })
    useAgentStore.getState().appendChunk({
      type: 'tool_result',
      content: '',
      metadata: { toolCallId: 'tc-3', toolName: 'write', parameters: { path: '/src/index.ts', content: 'new content' } },
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
      sessions: new Map([['session-1', [
        { id: 'msg-1', role: 'assistant', content: '', toolCall: { id: 'tc-4', toolName: 'bash', parameters: { command: 'echo hi' }, status: 'running' }, timestamp: Date.now() },
      ]]]),
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
      sessions: new Map([['session-1', [
        { id: 'msg-1', role: 'assistant', content: '', toolCall: { id: 'tc-5', toolName: 'bash', parameters: { command: 'bad' }, status: 'running' }, timestamp: Date.now() },
      ]]]),
      sessionMetas: new Map(),
    })
    useAgentStore.getState().appendChunk({
      type: 'tool_result',
      content: '',
      metadata: { toolCallId: 'tc-5', toolName: 'bash', parameters: { command: 'bad' }, error: 'command not found' },
    })
    expect(mockSandboxAppendOutput).toHaveBeenCalledWith({ type: 'stderr', content: 'command not found' })
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
    expect(useAgentStore.getState().sessionMetas.get(sessionId)?.currentModel).toEqual({ id: 'gpt-4o', provider: 'openai' })
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
    const messages: Array<{ id: string; role: 'user' | 'assistant' | 'system'; content: string; timestamp: number }> = Array.from(
      { length: 350 },
      (_, i) => ({
        id: `msg-${i}`,
        role: (i % 3 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
        content: `Message ${i}`,
        timestamp: Date.now(),
      }),
    )
    messages.unshift({ id: 'msg-sys', role: 'system', content: 'System note', timestamp: Date.now() })

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
      sessions: new Map([['session-1', [
        { id: 'msg-1', role: 'assistant' as const, content: 'Answer', timestamp: Date.now() },
      ]]]),
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
      sessions: new Map([['session-1', [
        { id: 'msg-1', role: 'assistant' as const, content: '', timestamp: Date.now() },
      ]]]),
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
})
