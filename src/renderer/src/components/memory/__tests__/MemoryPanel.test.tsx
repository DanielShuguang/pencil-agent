import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryPanel } from '../MemoryPanel'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('../../../stores/memory-store', () => ({
  useMemoryStore: vi.fn(),
}))

const { useMemoryStore } = await import('../../../stores/memory-store')
const mockUseMemoryStore = vi.mocked(useMemoryStore)

const mockSearchMemory = vi.fn()
const mockDeleteMemory = vi.fn()
const mockClearAllMemories = vi.fn()

function setupStore(overrides: Record<string, unknown> = {}) {
  mockUseMemoryStore.mockReturnValue({
    memories: [],
    searchResults: [],
    isLoading: false,
    searchQuery: '',
    searchMemory: mockSearchMemory,
    deleteMemory: mockDeleteMemory,
    clearAllMemories: mockClearAllMemories,
    ...overrides,
  } as unknown as ReturnType<typeof useMemoryStore>)
}

beforeEach(() => {
  vi.clearAllMocks()
  setupStore()
})

describe('MemoryPanel', () => {
  it('shows loading state', () => {
    setupStore({ isLoading: true })
    render(<MemoryPanel />)
    expect(screen.getByText('common.loading')).toBeInTheDocument()
  })

  it('shows empty state when no memories', () => {
    render(<MemoryPanel />)
    expect(screen.getByText('memory.noMemories')).toBeInTheDocument()
  })

  it('shows no results when searchQuery is set and no results', () => {
    setupStore({ searchQuery: 'test', searchResults: [] })
    render(<MemoryPanel />)
    expect(screen.getByText('memory.noResults')).toBeInTheDocument()
  })

  it('renders memory items with tags and score', () => {
    setupStore({
      memories: [
        {
          id: '1',
          content: 'test memory content',
          metadata: { tags: ['tag1', 'tag2'], sessionId: 's1', role: 'user', timestamp: 0 },
          score: 0.85,
        },
      ],
    })
    render(<MemoryPanel />)
    expect(screen.getByText(/test memory content/)).toBeInTheDocument()
    expect(screen.getByText('tag1')).toBeInTheDocument()
    expect(screen.getByText('tag2')).toBeInTheDocument()
    expect(screen.getByText(/0\.85/)).toBeInTheDocument()
  })

  it('triggers search on Enter key', async () => {
    const user = userEvent.setup()
    render(<MemoryPanel />)
    const input = screen.getByPlaceholderText('memory.searchPlaceholder')
    await user.type(input, 'query{Enter}')
    expect(mockSearchMemory).toHaveBeenCalledWith('query')
  })

  it('calls deleteMemory when delete button clicked', async () => {
    setupStore({
      memories: [
        {
          id: 'mem-1',
          content: 'delete me',
          metadata: { tags: [], sessionId: 's1', role: 'user', timestamp: 0 },
        },
      ],
    })
    const user = userEvent.setup()
    render(<MemoryPanel />)
    await user.click(screen.getByText('common.delete'))
    expect(mockDeleteMemory).toHaveBeenCalledWith('mem-1')
  })

  it('shows clear all button when items exist', () => {
    setupStore({
      memories: [
        {
          id: '1',
          content: 'item',
          metadata: { tags: [], sessionId: 's1', role: 'user', timestamp: 0 },
        },
      ],
    })
    render(<MemoryPanel />)
    expect(screen.getByText('memory.clearAll')).toBeInTheDocument()
  })

  it('calls clearAllMemories on clear all click', async () => {
    setupStore({
      memories: [
        {
          id: '1',
          content: 'item',
          metadata: { tags: [], sessionId: 's1', role: 'user', timestamp: 0 },
        },
      ],
    })
    const user = userEvent.setup()
    render(<MemoryPanel />)
    await user.click(screen.getByText('memory.clearAll'))
    expect(mockClearAllMemories).toHaveBeenCalled()
  })
})
