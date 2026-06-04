import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SessionList } from '../SessionList'
import { useAgentStore } from '../../../stores/agent-store'
import '../../../i18n'

vi.mock('../../../stores/agent-store', () => ({
  useAgentStore: vi.fn(),
}))

const mockUseAgentStore = vi.mocked(useAgentStore)

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
})

describe('SessionList', () => {
  it('shows empty message when no sessions', () => {
    mockUseAgentStore.mockReturnValue({
      sessionMetas: new Map(),
      activeSessionId: null,
      switchSession: vi.fn(),
      deleteSession: vi.fn(),
    } as unknown as ReturnType<typeof useAgentStore>)

    render(<SessionList />)
    expect(screen.getByText('暂无会话')).toBeInTheDocument()
  })

  it('renders session items sorted by updatedAt desc', () => {
    const sessions = new Map([
      [
        's1',
        {
          id: 's1',
          title: 'Old Session',
          model: { id: 'm1', provider: 'p1' },
          updatedAt: 1000,
          createdAt: 1000,
        },
      ],
      [
        's2',
        {
          id: 's2',
          title: 'New Session',
          model: { id: 'm1', provider: 'p1' },
          updatedAt: 2000,
          createdAt: 2000,
        },
      ],
    ])

    mockUseAgentStore.mockReturnValue({
      sessionMetas: sessions,
      activeSessionId: null,
      switchSession: vi.fn(),
      deleteSession: vi.fn(),
    } as unknown as ReturnType<typeof useAgentStore>)

    render(<SessionList />)
    const items = screen.getAllByText(/Session/)
    expect(items[0]).toHaveTextContent('New Session')
    expect(items[1]).toHaveTextContent('Old Session')
  })

  it('marks active session', () => {
    const sessions = new Map([
      [
        's1',
        {
          id: 's1',
          title: 'Active Session',
          model: { id: 'm1', provider: 'p1' },
          updatedAt: 1000,
          createdAt: 1000,
        },
      ],
    ])

    mockUseAgentStore.mockReturnValue({
      sessionMetas: sessions,
      activeSessionId: 's1',
      switchSession: vi.fn(),
      deleteSession: vi.fn(),
    } as unknown as ReturnType<typeof useAgentStore>)

    const { container } = render(<SessionList />)
    expect(container.querySelector('.bg-accent')).toBeInTheDocument()
  })

  it('calls switchSession on click', () => {
    const switchSession = vi.fn()
    const sessions = new Map([
      [
        's1',
        {
          id: 's1',
          title: 'Session',
          model: { id: 'm1', provider: 'p1' },
          updatedAt: 1000,
          createdAt: 1000,
        },
      ],
    ])

    mockUseAgentStore.mockReturnValue({
      sessionMetas: sessions,
      activeSessionId: null,
      switchSession,
      deleteSession: vi.fn(),
    } as unknown as ReturnType<typeof useAgentStore>)

    render(<SessionList />)
    fireEvent.click(screen.getByText('Session'))
    expect(switchSession).toHaveBeenCalledWith('s1')
  })
})
