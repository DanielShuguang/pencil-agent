import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

import '../../../i18n'

vi.mock('../../../stores/agent-store', () => ({
  useAgentStore: Object.assign(vi.fn(), { getState: vi.fn() }),
}))

vi.mock('../MessageBubble', () => ({
  MessageBubble: ({
    message,
    onRewind,
  }: {
    message: { id: string; content: string }
    onRewind: (id: string) => void
  }) => (
    <div data-testid={`message-${message.id}`}>
      {message.content}
      <button data-testid={`rewind-${message.id}`} onClick={() => onRewind(message.id)}>
        rewind
      </button>
    </div>
  ),
}))

vi.mock('../../ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

import { MessageList } from '../MessageList'
import { useAgentStore } from '../../../stores/agent-store'

const mockUseAgentStore = vi.mocked(useAgentStore) as any

const messages = [
  { id: 'm1', role: 'user', content: '你好世界', timestamp: 1 },
  { id: 'm2', role: 'assistant', content: 'Hello World', timestamp: 2 },
  { id: 'm3', role: 'assistant', content: '再见', timestamp: 3 },
]

function setStore(overrides: Record<string, unknown> = {}) {
  mockUseAgentStore.mockReturnValue({
    activeSessionId: 's1',
    sessions: new Map([['s1', messages]]),
    createBranch: vi.fn(),
    ...overrides,
  })
}

describe('MessageList 搜索与回退', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setStore()
  })

  it('没有活跃会话时展示空状态', () => {
    setStore({ activeSessionId: null, sessions: new Map() })

    render(<MessageList />)

    expect(screen.getByText('chat.startConversation')).toBeInTheDocument()
  })

  it('渲染全部消息', () => {
    render(<MessageList />)

    expect(screen.getAllByTestId(/^message-/)).toHaveLength(3)
  })

  it('Ctrl+F 打开搜索框', () => {
    render(<MessageList />)

    fireEvent.keyDown(window, { key: 'f', ctrlKey: true })

    expect(screen.getByPlaceholderText('chat.searchMessages')).toBeInTheDocument()
  })

  it('Meta+F 也能打开搜索框', () => {
    render(<MessageList />)

    fireEvent.keyDown(window, { key: 'f', metaKey: true })

    expect(screen.getByPlaceholderText('chat.searchMessages')).toBeInTheDocument()
  })

  it('搜索时按内容过滤消息', () => {
    render(<MessageList />)
    fireEvent.keyDown(window, { key: 'f', ctrlKey: true })

    fireEvent.change(screen.getByPlaceholderText('chat.searchMessages'), {
      target: { value: 'hello' },
    })

    expect(screen.getAllByTestId(/^message-/)).toHaveLength(1)
    expect(screen.getByTestId('message-m2')).toBeInTheDocument()
  })

  it('搜索时展示命中数量', () => {
    render(<MessageList />)
    fireEvent.keyDown(window, { key: 'f', ctrlKey: true })

    fireEvent.change(screen.getByPlaceholderText('chat.searchMessages'), {
      target: { value: 'e' },
    })

    expect(screen.getByText('1/3')).toBeInTheDocument()
  })

  it('搜索无结果时展示空状态', () => {
    render(<MessageList />)
    fireEvent.keyDown(window, { key: 'f', ctrlKey: true })

    fireEvent.change(screen.getByPlaceholderText('chat.searchMessages'), {
      target: { value: 'zzz' },
    })

    expect(screen.getByText('memory.noResults')).toBeInTheDocument()
  })

  it('Escape 关闭搜索并清空关键词', () => {
    render(<MessageList />)
    fireEvent.keyDown(window, { key: 'f', ctrlKey: true })
    fireEvent.change(screen.getByPlaceholderText('chat.searchMessages'), {
      target: { value: 'hello' },
    })

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(screen.queryByPlaceholderText('chat.searchMessages')).not.toBeInTheDocument()
  })

  it('点击关闭按钮退出搜索', () => {
    render(<MessageList />)
    fireEvent.keyDown(window, { key: 'f', ctrlKey: true })

    fireEvent.click(screen.getByText('common.close'))

    expect(screen.queryByPlaceholderText('chat.searchMessages')).not.toBeInTheDocument()
  })

  it('回退消息时创建分支', () => {
    const createBranch = vi.fn().mockResolvedValue(undefined)
    setStore({ createBranch })
    render(<MessageList />)

    fireEvent.click(screen.getByTestId('rewind-m1'))

    expect(createBranch).toHaveBeenCalledWith('m1')
  })

  it('卸载时移除 keydown 监听', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(<MessageList />)

    unmount()

    expect(removeSpy.mock.calls.some((call) => call[0] === 'keydown')).toBe(true)
    removeSpy.mockRestore()
  })

})
