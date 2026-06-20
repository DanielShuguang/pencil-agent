import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../i18n', () => ({
  default: {
    t: vi.fn((key: string, opts?: Record<string, unknown>) => {
      if (opts) return `${key}:${JSON.stringify(opts)}`
      return key
    }),
  },
}))

const mockGetState = vi.fn()
const mockSetState = vi.fn()
vi.mock('../../stores/agent-store', () => ({
  useAgentStore: { getState: mockGetState, setState: mockSetState },
}))

const mockModelGetState = vi.fn()
vi.mock('../../stores/model-config-store', () => ({
  useModelConfigStore: { getState: mockModelGetState },
}))

vi.mock('../export-chat', () => ({
  exportAsMarkdown: vi.fn(),
  exportAsJSON: vi.fn(),
}))

vi.mock('../toast', () => ({
  toast: { success: vi.fn() },
}))

const { isCommand, parseCommand, filterCommands, executeCommand, getCommands } = await import('../commands')
const { exportAsMarkdown, exportAsJSON } = await import('../export-chat')
const { toast } = await import('../toast')

function setupAgentState(overrides: Record<string, unknown> = {}) {
  const defaults = {
    activeSessionId: 'session-1',
    sessions: new Map([['session-1', [
      { id: 'msg-1', role: 'user', content: 'hello', timestamp: 1 },
      { id: 'msg-2', role: 'assistant', content: 'hi there', timestamp: 2 },
      { id: 'msg-3', role: 'tool', content: 'tool result', timestamp: 3 },
    ]]]),
    sessionMetas: new Map([['session-1', {
      id: 'session-1',
      title: 'Test Chat',
      currentModel: { id: 'gpt-4', provider: 'openai' },
      messageCount: 3,
      updatedAt: Date.now(),
    }]]),
    defaultModel: { id: 'gpt-4', provider: 'openai' },
    switchSessionModel: vi.fn(),
  }
  mockGetState.mockReturnValue({ ...defaults, ...overrides })
  return defaults
}

function setupModelState(providers: Array<{ id: string; name: string; models: Array<{ id: string; visible?: boolean }> }> = []) {
  mockModelGetState.mockReturnValue({ providers })
}

describe('isCommand', () => {
  it('should return true for inputs starting with /', () => {
    expect(isCommand('/help')).toBe(true)
    expect(isCommand('/clear')).toBe(true)
  })

  it('should return false for regular messages', () => {
    expect(isCommand('hello')).toBe(false)
    expect(isCommand('')).toBe(false)
  })

  it('should handle trimmed input', () => {
    expect(isCommand('  /help')).toBe(true) // trim().startsWith('/')
    expect(isCommand('/help  ')).toBe(true)
  })
})

describe('parseCommand', () => {
  it('should parse command without args', () => {
    expect(parseCommand('/help')).toEqual({ name: '/help', args: '' })
  })

  it('should parse command with args', () => {
    expect(parseCommand('/model gpt-4')).toEqual({ name: '/model', args: 'gpt-4' })
  })

  it('should parse command with multiple args', () => {
    expect(parseCommand('/export json extra')).toEqual({ name: '/export', args: 'json extra' })
  })

  it('should trim whitespace', () => {
    expect(parseCommand('  /help  ')).toEqual({ name: '/help', args: '' })
  })

  it('should handle args with spaces', () => {
    expect(parseCommand('/model  gpt-4-turbo')).toEqual({ name: '/model', args: ' gpt-4-turbo' })
  })
})

describe('filterCommands', () => {
  beforeEach(() => {
    setupAgentState()
    setupModelState()
  })

  it('should return all commands for empty query', () => {
    const commands = filterCommands('')
    expect(commands.length).toBeGreaterThan(0)
  })

  it('should return all commands for "/" query', () => {
    const commands = filterCommands('/')
    expect(commands.length).toBeGreaterThan(0)
  })

  it('should filter by command name prefix', () => {
    const commands = filterCommands('/mod')
    expect(commands).toHaveLength(1)
    expect(commands[0].name).toBe('/model')
  })

  it('should filter by description content', () => {
    const commands = filterCommands('help')
    const names = commands.map((c) => c.name)
    expect(names).toContain('/help')
  })

  it('should return empty for non-matching query', () => {
    const commands = filterCommands('/nonexistent')
    expect(commands).toHaveLength(0)
  })
})

describe('getCommands', () => {
  beforeEach(() => {
    setupAgentState()
    setupModelState()
  })

  it('should return all defined commands', () => {
    const commands = getCommands()
    const names = commands.map((c) => c.name)
    expect(names).toContain('/compact')
    expect(names).toContain('/clear')
    expect(names).toContain('/context')
    expect(names).toContain('/model')
    expect(names).toContain('/export')
    expect(names).toContain('/memory')
    expect(names).toContain('/help')
  })
})

describe('/compact', () => {
  beforeEach(() => {
    setupModelState()
  })

  it('should return error when no active session', () => {
    setupAgentState({ activeSessionId: null })
    const result = executeCommand('/compact')
    expect(result).toBe('commands.noActiveSession')
  })

  it('should return message count and char count', () => {
    setupAgentState()
    const result = executeCommand('/compact')
    expect(result).toContain('3')  // 3 messages
    expect(result).toContain('24') // 'hello'.length(5) + 'hi there'.length(8) + 'tool result'.length(11)
  })

  it('should handle empty session', () => {
    setupAgentState({ sessions: new Map([['session-1', []]]) })
    const result = executeCommand('/compact')
    expect(result).toContain('0')
  })
})

describe('/clear', () => {
  beforeEach(() => {
    setupModelState()
  })

  it('should return error when no active session', () => {
    setupAgentState({ activeSessionId: null })
    const result = executeCommand('/clear')
    expect(result).toBe('commands.noActiveSession')
  })

  it('should clear messages for active session', () => {
    setupAgentState()
    const result = executeCommand('/clear')
    expect(mockSetState).toHaveBeenCalled()
    expect(result).toBe('commands.cleared')
  })
})

describe('/context', () => {
  beforeEach(() => {
    setupModelState()
  })

  it('should return error when no active session', () => {
    setupAgentState({ activeSessionId: null })
    const result = executeCommand('/context')
    expect(result).toBe('commands.noActiveSession')
  })

  it('should return context info with model and message counts', () => {
    setupAgentState()
    const result = executeCommand('/context')
    expect(result).toContain('gpt-4')
    expect(result).toContain('3') // total messages
    expect(result).toContain('1') // user messages
  })

  it('should use defaultModel when session has no currentModel', () => {
    setupAgentState({
      sessionMetas: new Map([['session-1', { id: 'session-1', title: 'Test', messageCount: 3, updatedAt: Date.now() }]]),
      defaultModel: { id: 'claude-3', provider: 'anthropic' },
    })
    const result = executeCommand('/context')
    expect(result).toContain('claude-3')
  })
})

describe('/model', () => {
  beforeEach(() => {
    setupAgentState()
  })

  it('should list available models when no args', () => {
    setupModelState([
      { id: 'openai', name: 'OpenAI', models: [{ id: 'gpt-4' }, { id: 'gpt-3.5-turbo', visible: false }] },
      { id: 'anthropic', name: 'Anthropic', models: [{ id: 'claude-3' }] },
    ])
    const result = executeCommand('/model')
    expect(result).toContain('gpt-4')
    expect(result).toContain('claude-3')
    // hidden model should not appear
    expect(result).not.toContain('gpt-3.5-turbo')
  })

  it('should switch to valid model', () => {
    const state = setupAgentState()
    setupModelState([
      { id: 'openai', name: 'OpenAI', models: [{ id: 'gpt-4-turbo' }] },
    ])
    const result = executeCommand('/model gpt-4-turbo')
    expect(state.switchSessionModel).toHaveBeenCalledWith({ id: 'gpt-4-turbo', provider: 'openai' })
    expect(result).toContain('gpt-4-turbo')
  })

  it('should return error for unknown model', () => {
    setupAgentState()
    setupModelState([{ id: 'openai', name: 'OpenAI', models: [{ id: 'gpt-4' }] }])
    const result = executeCommand('/model unknown-model')
    expect(result).toContain('unknown-model')
  })
})

describe('/export', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupModelState()
  })

  it('should return error when no active session', () => {
    setupAgentState({ activeSessionId: null })
    const result = executeCommand('/export')
    expect(result).toBe('commands.noActiveSession')
  })

  it('should return error when no messages', () => {
    setupAgentState({ sessions: new Map([['session-1', []]]) })
    const result = executeCommand('/export')
    expect(result).toBe('commands.noMessages')
  })

  it('should export as markdown by default', () => {
    setupAgentState()
    executeCommand('/export')
    expect(exportAsMarkdown).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalled()
  })

  it('should export as JSON when specified', () => {
    setupAgentState()
    executeCommand('/export json')
    expect(exportAsJSON).toHaveBeenCalled()
    expect(exportAsMarkdown).not.toHaveBeenCalled()
  })

  it('should use session title for filename', () => {
    setupAgentState()
    executeCommand('/export md')
    expect(exportAsMarkdown).toHaveBeenCalledWith(
      expect.any(Array),
      'Test Chat',
    )
  })
})

describe('/memory', () => {
  beforeEach(() => {
    setupAgentState()
    setupModelState()
  })

  it('should dispatch open-settings event', () => {
    const handler = vi.fn()
    window.addEventListener('open-settings', handler)
    executeCommand('/memory')
    expect(handler).toHaveBeenCalled()
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail).toEqual({ tab: 'memory' })
    window.removeEventListener('open-settings', handler)
  })
})

describe('/help', () => {
  beforeEach(() => {
    setupAgentState()
    setupModelState()
  })

  it('should list all commands', () => {
    const result = executeCommand('/help')!
    expect(result).toContain('/compact')
    expect(result).toContain('/clear')
    expect(result).toContain('/context')
    expect(result).toContain('/model')
    expect(result).toContain('/export')
    expect(result).toContain('/memory')
    expect(result).toContain('/help')
  })
})

describe('executeCommand', () => {
  beforeEach(() => {
    setupAgentState()
    setupModelState()
  })

  it('should return error for unknown command', () => {
    const result = executeCommand('/unknown')
    expect(result).toContain('/unknown')
  })

  it('should handle command with leading/trailing spaces', () => {
    const result = executeCommand('  /help  ')
    expect(result).toContain('/help')
  })
})
