import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VirtualMessageList } from '../VirtualMessageList'
import { useAgentStore } from '../../../stores/agent-store'
import { useListRef } from 'react-window'

vi.mock('../../../stores/agent-store')

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}))

vi.mock('react-window', () => ({
  List: vi.fn(({ rowComponent: RowComponent, rowCount, rowProps }) => (
    <div data-testid='virtual-list'>
      {Array.from({ length: rowCount }, (_, index) => (
        <div key={index} data-testid={`row-${index}`}>
          <RowComponent index={index} style={{}} {...rowProps} />
        </div>
      ))}
    </div>
  )),
  useDynamicRowHeight: vi.fn(() => 80),
  useListRef: vi.fn(() => ({ current: null })),
}))

describe('VirtualMessageList', () => {
  const mockMessages = Array.from({ length: 100 }, (_, i) => ({
    id: `msg-${i}`,
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `Message ${i}`,
    timestamp: Date.now() + i,
  }))

  beforeEach(() => {
    vi.mocked(useAgentStore).mockReturnValue({
      activeSessionId: 'session-1',
      sessions: new Map([['session-1', mockMessages]]),
    })
    vi.mocked(useListRef).mockReset()
    vi.mocked(useListRef).mockReturnValue({ current: undefined } as any)
  })

  it('should render virtual list when messages exist', () => {
    render(<VirtualMessageList />)
    expect(screen.getByTestId('virtual-list')).toBeDefined()
  })

  it('should render empty state when no messages', () => {
    vi.mocked(useAgentStore).mockReturnValue({
      activeSessionId: 'session-1',
      sessions: new Map(),
    })

    render(<VirtualMessageList />)
    expect(screen.getByText('chat.startConversation')).toBeDefined()
  })

  it('should render messages with correct content', () => {
    render(<VirtualMessageList />)
    expect(screen.getByText('Message 0')).toBeDefined()
  })

  it('should scroll to bottom on mount when messages exist', () => {
    const scrollToRow = vi.fn()
    vi.mocked(useListRef).mockReturnValue({ current: { element: null, scrollToRow } })

    render(<VirtualMessageList />)

    expect(scrollToRow).toHaveBeenCalledTimes(1)
    expect(scrollToRow).toHaveBeenCalledWith({ index: 99, align: 'end' })
  })

  it('should scroll to bottom when new messages arrive', () => {
    const scrollToRow = vi.fn()
    vi.mocked(useListRef).mockReturnValue({ current: { element: null, scrollToRow } })

    const { rerender } = render(<VirtualMessageList />)
    expect(scrollToRow).toHaveBeenCalledTimes(1)
    expect(scrollToRow).toHaveBeenCalledWith({ index: 99, align: 'end' })

    const newMessages = [
      ...mockMessages,
      { id: 'msg-100', role: 'assistant', content: 'New message', timestamp: Date.now() + 1000 },
    ]
    vi.mocked(useAgentStore).mockReturnValue({
      activeSessionId: 'session-1',
      sessions: new Map([['session-1', newMessages]]),
    })

    rerender(<VirtualMessageList />)

    expect(scrollToRow).toHaveBeenCalledTimes(2)
    expect(scrollToRow).toHaveBeenCalledWith({ index: 100, align: 'end' })
  })

  it('should not scroll when there are no messages', () => {
    const scrollToRow = vi.fn()
    vi.mocked(useListRef).mockReturnValue({ current: { element: null, scrollToRow } })

    vi.mocked(useAgentStore).mockReturnValue({
      activeSessionId: 'session-1',
      sessions: new Map(),
    })

    render(<VirtualMessageList />)

    expect(scrollToRow).not.toHaveBeenCalled()
  })
})
