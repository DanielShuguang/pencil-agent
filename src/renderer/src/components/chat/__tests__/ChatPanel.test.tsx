import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ChatPanel } from '../ChatPanel'
import '../../../i18n'

vi.mock('../../../stores/agent-store', () => ({
  useAgentStore: Object.assign(vi.fn(), {
    getState: vi.fn(),
  }),
}))

const libMocks = vi.hoisted(() => ({
  exportAsMarkdown: vi.fn(),
  exportAsJSON: vi.fn(),
  toastSuccess: vi.fn(),
}))

vi.mock('../../../lib/export-chat', () => ({
  exportAsMarkdown: libMocks.exportAsMarkdown,
  exportAsJSON: libMocks.exportAsJSON,
}))

vi.mock('../../../lib/toast', () => ({
  toast: { success: libMocks.toastSuccess },
}))

vi.mock('../MessageList', () => ({
  MessageList: () => <div data-testid='message-list'>MessageList</div>,
}))

vi.mock('../VirtualMessageList', () => ({
  VirtualMessageList: () => <div data-testid='virtual-message-list'>VirtualMessageList</div>,
}))

vi.mock('../InputBar', () => ({
  InputBar: ({
    disabled,
    onSend,
    onStop,
    isGenerating,
  }: {
    disabled: boolean
    onSend: (content: string) => void
    onStop: () => void
    isGenerating: boolean
  }) => (
    <div data-testid='input-bar' data-disabled={disabled} data-generating={isGenerating}>
      <button data-testid='send' onClick={() => onSend('hello')}>
        send
      </button>
      <button data-testid='stop' onClick={onStop}>
        stop
      </button>
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
const mockUseAgentStore = vi.mocked(useAgentStore) as any

function sessionMeta(id = 's1', title = 'My Chat') {
  return {
    id,
    title,
    model: { id: 'm1', provider: 'p1' },
    updatedAt: 1000,
    createdAt: 1000,
  }
}

function stateWithMessages(messages: any[], overrides: Record<string, unknown> = {}) {
  return {
    activeSessionId: 's1',
    isGenerating: false,
    stopGeneration: vi.fn(),
    sessionMetas: new Map([['s1', sessionMeta()]]),
    sessions: new Map([['s1', messages]]),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseAgentStore.mockReturnValue({
    activeSessionId: null,
    isGenerating: false,
    stopGeneration: vi.fn(),
    sessionMetas: new Map(),
    sessions: new Map(),
  } as unknown as ReturnType<typeof useAgentStore>)
  mockUseAgentStore.getState.mockReturnValue({ sendMessage: vi.fn() })
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

  describe('导出对话', () => {
    const messages = [{ id: 'm1', role: 'user', content: '你好', timestamp: 1 }]

    it('没有消息时不显示导出按钮', () => {
      render(<ChatPanel />)

      expect(screen.queryByTitle('导出对话')).not.toBeInTheDocument()
    })

    it('有消息时点击展开导出菜单', () => {
      mockUseAgentStore.mockReturnValue(
        stateWithMessages(messages) as unknown as ReturnType<typeof useAgentStore>,
      )

      render(<ChatPanel />)
      fireEvent.click(screen.getByTitle('导出对话'))

      expect(screen.getByText('导出为 Markdown')).toBeInTheDocument()
      expect(screen.getByText('导出为 JSON')).toBeInTheDocument()
    })

    it('再次点击收起导出菜单', () => {
      mockUseAgentStore.mockReturnValue(
        stateWithMessages(messages) as unknown as ReturnType<typeof useAgentStore>,
      )

      render(<ChatPanel />)
      fireEvent.click(screen.getByTitle('导出对话'))
      fireEvent.click(screen.getByTitle('导出对话'))

      expect(screen.queryByText('导出为 Markdown')).not.toBeInTheDocument()
    })

    it('点击菜单外部关闭导出菜单', () => {
      mockUseAgentStore.mockReturnValue(
        stateWithMessages(messages) as unknown as ReturnType<typeof useAgentStore>,
      )

      render(<ChatPanel />)
      fireEvent.click(screen.getByTitle('导出对话'))
      act(() => {
        document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      })

      expect(screen.queryByText('导出为 Markdown')).not.toBeInTheDocument()
    })

    it('导出 Markdown 时使用会话标题并提示', () => {
      mockUseAgentStore.mockReturnValue(
        stateWithMessages(messages) as unknown as ReturnType<typeof useAgentStore>,
      )

      render(<ChatPanel />)
      fireEvent.click(screen.getByTitle('导出对话'))
      fireEvent.click(screen.getByText('导出为 Markdown'))

      expect(libMocks.exportAsMarkdown).toHaveBeenCalledWith(messages, 'My Chat')
      expect(libMocks.exportAsJSON).not.toHaveBeenCalled()
      expect(libMocks.toastSuccess).toHaveBeenCalledWith('对话已导出')
      expect(screen.queryByText('导出为 JSON')).not.toBeInTheDocument()
    })

    it('导出 JSON 时调用 JSON 导出', () => {
      mockUseAgentStore.mockReturnValue(
        stateWithMessages(messages) as unknown as ReturnType<typeof useAgentStore>,
      )

      render(<ChatPanel />)
      fireEvent.click(screen.getByTitle('导出对话'))
      fireEvent.click(screen.getByText('导出为 JSON'))

      expect(libMocks.exportAsJSON).toHaveBeenCalledWith(messages, 'My Chat')
      expect(libMocks.exportAsMarkdown).not.toHaveBeenCalled()
    })

    it('没有标题时使用 chat 作为文件名', () => {
      const sessionMetas = new Map([['s1', { id: 's1' }]])
      mockUseAgentStore.mockReturnValue(
        stateWithMessages(messages, { sessionMetas }) as unknown as ReturnType<typeof useAgentStore>,
      )

      render(<ChatPanel />)
      fireEvent.click(screen.getByTitle('导出对话'))
      fireEvent.click(screen.getByText('导出为 Markdown'))

      expect(libMocks.exportAsMarkdown).toHaveBeenCalledWith(messages, 'chat')
    })
  })

  it('InputBar onSend 回调把内容交给 sendMessage', () => {
    const sendMessage = vi.fn()
    mockUseAgentStore.getState.mockReturnValue({ sendMessage })
    mockUseAgentStore.mockReturnValue(
      stateWithMessages([]) as unknown as ReturnType<typeof useAgentStore>,
    )

    render(<ChatPanel />)
    fireEvent.click(screen.getByTestId('send'))

    expect(sendMessage).toHaveBeenCalledWith('hello')
  })

  it('停止生成时传递 stopGeneration 给 InputBar', () => {
    const stopGeneration = vi.fn()
    mockUseAgentStore.mockReturnValue(
      stateWithMessages([], { stopGeneration, isGenerating: true }) as unknown as ReturnType<
        typeof useAgentStore
      >,
    )

    render(<ChatPanel />)

    expect(screen.getByTestId('input-bar')).toHaveAttribute('data-generating', 'true')
    fireEvent.click(screen.getByTestId('stop'))
    expect(stopGeneration).toHaveBeenCalled()
  })
})
