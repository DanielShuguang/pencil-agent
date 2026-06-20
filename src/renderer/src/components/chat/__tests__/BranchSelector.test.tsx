import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BranchSelector } from '../BranchSelector'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('../../../stores/agent-store', () => ({
  useAgentStore: vi.fn(),
}))

const { useAgentStore } = await import('../../../stores/agent-store')
const mockUseAgentStore = vi.mocked(useAgentStore)

const mockSwitchSession = vi.fn()
const mockGetBranches = vi.fn()

function setupStore(overrides: Record<string, unknown> = {}) {
  mockUseAgentStore.mockReturnValue({
    activeSessionId: 'session-1',
    sessionMetas: new Map(),
    getBranches: mockGetBranches.mockReturnValue([]),
    switchSession: mockSwitchSession,
    ...overrides,
  } as unknown as ReturnType<typeof useAgentStore>)
}

beforeEach(() => {
  vi.clearAllMocks()
  setupStore()
})

describe('BranchSelector', () => {
  it('returns null when no activeSessionId', () => {
    setupStore({ activeSessionId: null })
    const { container } = render(<BranchSelector />)
    expect(container.innerHTML).toBe('')
  })

  it('renders without branches or parent', () => {
    const { container } = render(<BranchSelector />)
    expect(container.querySelector('.flex')).toBeInTheDocument()
    expect(screen.queryByText('chat.backToParent')).not.toBeInTheDocument()
  })

  it('shows back-to-parent button when parentId exists', () => {
    setupStore({
      sessionMetas: new Map([
        ['session-1', { parentSessionId: 'parent-1' }],
      ]),
    })
    render(<BranchSelector />)
    expect(screen.getByText('chat.backToParent')).toBeInTheDocument()
  })

  it('calls switchSession with parentId on back button click', async () => {
    setupStore({
      sessionMetas: new Map([
        ['session-1', { parentSessionId: 'parent-1' }],
      ]),
    })
    const user = userEvent.setup()
    render(<BranchSelector />)
    await user.click(screen.getByText('chat.backToParent'))
    expect(mockSwitchSession).toHaveBeenCalledWith('parent-1')
  })

  it('shows select with branches when branches exist', () => {
    setupStore()
    mockGetBranches.mockReturnValue([
      { id: 'branch-1', title: 'Branch A' },
      { id: 'branch-2', title: 'Branch B' },
    ])
    render(<BranchSelector />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })
})
