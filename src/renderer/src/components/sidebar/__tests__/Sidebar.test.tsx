import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Sidebar } from '../Sidebar'
import '../../../i18n'

const mockHandleNewSession = vi.fn()

vi.mock('../../../stores/agent-store', () => ({
  useAgentStore: vi.fn(),
}))

vi.mock('../../../hooks/useNewSession', () => ({
  useNewSession: () => mockHandleNewSession,
}))

vi.mock('../SessionList', () => ({
  SessionList: () => <div data-testid='session-list'>SessionList</div>,
}))

const { useAgentStore } = await import('../../../stores/agent-store')
const mockUseAgentStore = vi.mocked(useAgentStore)

beforeEach(() => {
  mockHandleNewSession.mockClear()
  vi.stubGlobal('window', {
    ...window,
    api: {
      ...window.api,
      dialog: {
        selectDirectory: vi.fn().mockResolvedValue({ canceled: false, filePaths: ['/tmp'] }),
      },
    },
  })
  mockUseAgentStore.mockReturnValue({
    createSession: vi.fn(),
    sessionMetas: new Map(),
    activeSessionId: null,
    switchSession: vi.fn(),
    deleteSession: vi.fn(),
  } as unknown as ReturnType<typeof useAgentStore>)
})

describe('Sidebar', () => {
  it('renders expanded by default', () => {
    render(<Sidebar />)
    expect(screen.getByText('会话')).toBeInTheDocument()
    expect(screen.getByTestId('session-list')).toBeInTheDocument()
  })

  it('shows new session button in expanded mode', () => {
    render(<Sidebar />)
    const addButtons = screen.getAllByRole('button')
    expect(addButtons.length).toBeGreaterThanOrEqual(2)
  })

  it('calls handleNewSession on new session click', () => {
    render(<Sidebar />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[buttons.length - 1])
    expect(mockHandleNewSession).toHaveBeenCalled()
  })

  it('collapses when sessions button is clicked', () => {
    render(<Sidebar />)
    fireEvent.click(screen.getByText('会话'))
    expect(screen.queryByText('会话')).not.toBeInTheDocument()
    expect(screen.queryByTestId('session-list')).not.toBeInTheDocument()
  })

  it('expands when collapse button is clicked', () => {
    render(<Sidebar />)
    fireEvent.click(screen.getByText('会话'))
    const expandButton = screen.getAllByRole('button')[0]
    fireEvent.click(expandButton)
    expect(screen.getByText('会话')).toBeInTheDocument()
    expect(screen.getByTestId('session-list')).toBeInTheDocument()
  })

  it('shows new session button in collapsed mode', () => {
    render(<Sidebar />)
    fireEvent.click(screen.getByText('会话'))
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBe(2)
  })
})
