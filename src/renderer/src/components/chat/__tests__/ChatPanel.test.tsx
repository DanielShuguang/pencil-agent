import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChatPanel } from '../ChatPanel'
import '../../../i18n'

vi.mock('../../../stores/agent-store', () => ({
  useAgentStore: vi.fn(),
}))

vi.mock('../MessageList', () => ({
  MessageList: () => <div data-testid='message-list'>MessageList</div>,
}))

vi.mock('../VirtualMessageList', () => ({
  VirtualMessageList: () => <div data-testid='virtual-message-list'>VirtualMessageList</div>,
}))

vi.mock('../InputBar', () => ({
  InputBar: ({ disabled }: { disabled: boolean }) => (
    <div data-testid='input-bar' data-disabled={disabled}>
      InputBar
    </div>
  ),
}))

vi.mock('../ModelSelector', () => ({
  ModelSelector: () => <div data-testid='model-selector'>ModelSelector</div>,
}))

vi.mock('../BranchSelector', () => ({
  BranchSelector: () => <div data-testid='branch-selector'>BranchSelector</div>,
}))

const { useAgentStore } = await import('../../../stores/agent-store')
const mockUseAgentStore = vi.mocked(useAgentStore)

beforeEach(() => {
  mockUseAgentStore.mockReturnValue({
    activeSessionId: null,
    isGenerating: false,
    stopGeneration: vi.fn(),
    sessionMetas: new Map(),
    sessions: new Map(),
  } as unknown as ReturnType<typeof useAgentStore>)
})

describe('ChatPanel', () => {
  it('renders with default title when no active session', () => {
    render(<ChatPanel />)
    expect(screen.getByText('Pencil Agent')).toBeInTheDocument()
  })

  it('renders session title when active', () => {
    const sessionMetas = new Map([
      [
        's1',
        {
          id: 's1',
          title: 'My Chat',
          model: { id: 'm1', provider: 'p1' },
          updatedAt: 1000,
          createdAt: 1000,
        },
      ],
    ])
    mockUseAgentStore.mockReturnValue({
      activeSessionId: 's1',
      isGenerating: false,
      stopGeneration: vi.fn(),
      sessionMetas,
      sessions: new Map([['s1', []]]),
    } as unknown as ReturnType<typeof useAgentStore>)

    render(<ChatPanel />)
    expect(screen.getByText('My Chat')).toBeInTheDocument()
  })

  it('uses MessageList for small message count', () => {
    const sessions = new Map([['s1', Array.from({ length: 10 }, (_, i) => ({ id: `m${i}` }))]])
    mockUseAgentStore.mockReturnValue({
      activeSessionId: 's1',
      isGenerating: false,
      stopGeneration: vi.fn(),
      sessionMetas: new Map([
        [
          's1',
          {
            id: 's1',
            title: 'Chat',
            model: { id: 'm1', provider: 'p1' },
            updatedAt: 1000,
            createdAt: 1000,
          },
        ],
      ]),
      sessions,
    } as unknown as ReturnType<typeof useAgentStore>)

    render(<ChatPanel />)
    expect(screen.getByTestId('message-list')).toBeInTheDocument()
    expect(screen.queryByTestId('virtual-message-list')).not.toBeInTheDocument()
  })

  it('uses VirtualMessageList for large message count (>50)', () => {
    const sessions = new Map([['s1', Array.from({ length: 51 }, (_, i) => ({ id: `m${i}` }))]])
    mockUseAgentStore.mockReturnValue({
      activeSessionId: 's1',
      isGenerating: false,
      stopGeneration: vi.fn(),
      sessionMetas: new Map([
        [
          's1',
          {
            id: 's1',
            title: 'Chat',
            model: { id: 'm1', provider: 'p1' },
            updatedAt: 1000,
            createdAt: 1000,
          },
        ],
      ]),
      sessions,
    } as unknown as ReturnType<typeof useAgentStore>)

    render(<ChatPanel />)
    expect(screen.getByTestId('virtual-message-list')).toBeInTheDocument()
    expect(screen.queryByTestId('message-list')).not.toBeInTheDocument()
  })

  it('disables input when no active session', () => {
    mockUseAgentStore.mockReturnValue({
      activeSessionId: null,
      isGenerating: false,
      stopGeneration: vi.fn(),
      sessionMetas: new Map(),
      sessions: new Map(),
    } as unknown as ReturnType<typeof useAgentStore>)

    render(<ChatPanel />)
    expect(screen.getByTestId('input-bar')).toHaveAttribute('data-disabled', 'true')
  })

  it('enables input when session is active', () => {
    mockUseAgentStore.mockReturnValue({
      activeSessionId: 's1',
      isGenerating: false,
      stopGeneration: vi.fn(),
      sessionMetas: new Map([
        [
          's1',
          {
            id: 's1',
            title: 'Chat',
            model: { id: 'm1', provider: 'p1' },
            updatedAt: 1000,
            createdAt: 1000,
          },
        ],
      ]),
      sessions: new Map([['s1', []]]),
    } as unknown as ReturnType<typeof useAgentStore>)

    render(<ChatPanel />)
    expect(screen.getByTestId('input-bar')).toHaveAttribute('data-disabled', 'false')
  })

  it('renders ModelSelector and BranchSelector', () => {
    render(<ChatPanel />)
    expect(screen.getByTestId('model-selector')).toBeInTheDocument()
    expect(screen.getByTestId('branch-selector')).toBeInTheDocument()
  })
})
