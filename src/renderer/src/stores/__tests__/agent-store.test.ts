import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAgentStore } from '../agent-store'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
  vi.stubGlobal('window', {
    ...window,
    api: {
      agent: {
        create: vi.fn().mockResolvedValue(undefined),
        prompt: vi.fn(),
        stop: vi.fn()
      }
    }
  })
  useAgentStore.setState({
    sessions: new Map(),
    activeSessionId: null,
    isGenerating: false
  })
})

describe('agent-store', () => {
  it('default state', () => {
    const state = useAgentStore.getState()
    expect(state.activeSessionId).toBeNull()
    expect(state.isGenerating).toBe(false)
    expect(state.sessions.size).toBe(0)
    expect(state.currentModel).toEqual({
      id: 'claude-sonnet-4-20250514',
      provider: 'anthropic'
    })
  })

  it('createSession creates a new session and calls window.api.agent.create', async () => {
    const id = await useAgentStore.getState().createSession()
    expect(id).toMatch(/^session-\d+$/)
    expect(window.api.agent.create).toHaveBeenCalledWith({
      sessionId: id,
      model: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' }
    })
    expect(useAgentStore.getState().activeSessionId).toBe(id)
    expect(useAgentStore.getState().sessions.get(id)).toEqual([])
  })

  it('createSession sets the new session as active', async () => {
    await useAgentStore.getState().createSession()
    expect(useAgentStore.getState().activeSessionId).toBeTruthy()
  })

  it('sendMessage adds a user message and calls window.api.agent.prompt', () => {
    useAgentStore.setState({
      activeSessionId: 'session-1',
      sessions: new Map([['session-1', []]])
    })
    useAgentStore.getState().sendMessage('Hello')
    const messages = useAgentStore.getState().sessions.get('session-1')!
    expect(messages).toHaveLength(1)
    expect(messages[0].role).toBe('user')
    expect(messages[0].content).toBe('Hello')
    expect(window.api.agent.prompt).toHaveBeenCalledWith('session-1', 'Hello')
  })

  it('sendMessage sets isGenerating to true', () => {
    useAgentStore.setState({
      activeSessionId: 'session-1',
      sessions: new Map([['session-1', []]])
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
            {
              id: 'msg-1',
              role: 'user' as const,
              content: 'Hi',
              timestamp: Date.now()
            },
            {
              id: 'msg-2',
              role: 'assistant' as const,
              content: 'Hello',
              timestamp: Date.now()
            }
          ]
        ]
      ])
    })
    useAgentStore.getState().appendChunk({
      type: 'text',
      content: ' World'
    })
    const messages = useAgentStore.getState().sessions.get('session-1')!
    expect(messages).toHaveLength(2)
    expect(messages[1].content).toBe('Hello World')
  })

  it('appendChunk creates a new message when no assistant message exists', () => {
    useAgentStore.setState({
      activeSessionId: 'session-1',
      sessions: new Map([['session-1', []]])
    })
    useAgentStore.getState().appendChunk({
      type: 'text',
      content: 'Hello World'
    })
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

  it('stopGeneration calls window.api.agent.stop and sets isGenerating false', () => {
    useAgentStore.setState({
      activeSessionId: 'session-1',
      isGenerating: true
    })
    useAgentStore.getState().stopGeneration()
    expect(window.api.agent.stop).toHaveBeenCalledWith('session-1')
    expect(useAgentStore.getState().isGenerating).toBe(false)
  })

  it('switchSession changes activeSessionId', () => {
    useAgentStore.getState().switchSession('session-2')
    expect(useAgentStore.getState().activeSessionId).toBe('session-2')
  })
})
