import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemorySearch } from '../MemorySearch'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('../../../stores/memory-store', () => ({
  useMemoryStore: vi.fn(),
}))

const { useMemoryStore } = await import('../../../stores/memory-store')
const mockUseMemoryStore = vi.mocked(useMemoryStore)

const mockSearchMemory = vi.fn()

function setupStore(overrides: Record<string, unknown> = {}) {
  mockUseMemoryStore.mockReturnValue({
    searchResults: [],
    isLoading: false,
    searchMemory: mockSearchMemory,
    ...overrides,
  } as unknown as ReturnType<typeof useMemoryStore>)
}

beforeEach(() => {
  vi.clearAllMocks()
  setupStore()
})

describe('MemorySearch', () => {
  it('renders input and button', () => {
    render(<MemorySearch />)
    expect(screen.getByPlaceholderText('memory.searchPlaceholder')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'memory.search' })).toBeInTheDocument()
  })

  it('button is disabled when input is empty', () => {
    render(<MemorySearch />)
    expect(screen.getByRole('button', { name: 'memory.search' })).toBeDisabled()
  })

  it('button is enabled when input has text', async () => {
    const user = userEvent.setup()
    render(<MemorySearch />)
    await user.type(screen.getByPlaceholderText('memory.searchPlaceholder'), 'query')
    expect(screen.getByRole('button', { name: 'memory.search' })).not.toBeDisabled()
  })

  it('shows searching text when loading', () => {
    setupStore({ isLoading: true })
    render(<MemorySearch />)
    expect(screen.getByText('memory.searching')).toBeInTheDocument()
  })

  it('calls searchMemory on button click', async () => {
    const user = userEvent.setup()
    render(<MemorySearch />)
    const input = screen.getByPlaceholderText('memory.searchPlaceholder')
    await user.type(input, 'test query')
    await user.click(screen.getByRole('button', { name: 'memory.search' }))
    expect(mockSearchMemory).toHaveBeenCalledWith('test query')
  })

  it('calls searchMemory on Enter key', async () => {
    const user = userEvent.setup()
    render(<MemorySearch />)
    await user.type(screen.getByPlaceholderText('memory.searchPlaceholder'), 'query{Enter}')
    expect(mockSearchMemory).toHaveBeenCalledWith('query')
  })

  it('renders search results', () => {
    setupStore({
      searchResults: [
        {
          id: '1',
          content: 'result content here',
          metadata: { tags: ['tag1'], sessionId: 's1', role: 'user', timestamp: 0 },
          score: 0.9,
        },
      ],
    })
    render(<MemorySearch />)
    expect(screen.getByText(/result content here/)).toBeInTheDocument()
    expect(screen.getByText('tag1')).toBeInTheDocument()
  })

  it('calls onResultSelect when result clicked', async () => {
    const onResultSelect = vi.fn()
    setupStore({
      searchResults: [
        {
          id: '1',
          content: 'selected content',
          metadata: { tags: [], sessionId: 's1', role: 'user', timestamp: 0 },
        },
      ],
    })
    const user = userEvent.setup()
    render(<MemorySearch onResultSelect={onResultSelect} />)
    await user.click(screen.getByText(/selected content/))
    expect(onResultSelect).toHaveBeenCalledWith('selected content')
  })
})
