import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VirtualMessageList } from '../VirtualMessageList'
import { useAgentStore } from '../../../stores/agent-store'

vi.mock('../../../stores/agent-store')

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}))

vi.mock('react-window', () => ({
  VariableSizeList: vi.fn(({ children, itemCount }) => (
    <div data-testid='virtual-list'>
      {Array.from({ length: itemCount }, (_, index) => (
        <div key={index} data-testid={`row-${index}`}>
          {children({ index, style: {} })}
        </div>
      ))}
    </div>
  )),
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
})