import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TabBar } from '../TabBar'

vi.mock('../../../stores/editor-store', () => ({
  useEditorStore: vi.fn(),
}))

const { useEditorStore } = await import('../../../stores/editor-store')
const mockUseEditorStore = vi.mocked(useEditorStore)

beforeEach(() => {
  vi.clearAllMocks()
  mockUseEditorStore.mockReturnValue({
    files: new Map(),
    openFiles: [],
    activeFilePath: null,
    setActiveFile: vi.fn(),
    closeFile: vi.fn(),
  } as unknown as ReturnType<typeof useEditorStore>)
})

describe('TabBar', () => {
  it('returns null when no open files', () => {
    const { container } = render(<TabBar />)
    expect(container.firstChild).toBeNull()
  })

  it('renders tab for each open file', () => {
    const files = new Map([
      ['src/a.ts', { name: 'a.ts', content: '', language: 'typescript', isModified: false }],
      ['src/b.ts', { name: 'b.ts', content: '', language: 'typescript', isModified: false }],
    ])
    mockUseEditorStore.mockReturnValue({
      files,
      openFiles: ['src/a.ts', 'src/b.ts'],
      activeFilePath: 'src/a.ts',
      setActiveFile: vi.fn(),
      closeFile: vi.fn(),
    } as unknown as ReturnType<typeof useEditorStore>)

    render(<TabBar />)
    expect(screen.getByText('a.ts')).toBeInTheDocument()
    expect(screen.getByText('b.ts')).toBeInTheDocument()
  })

  it('highlights active tab', () => {
    const files = new Map([
      ['src/a.ts', { name: 'a.ts', content: '', language: 'typescript', isModified: false }],
      ['src/b.ts', { name: 'b.ts', content: '', language: 'typescript', isModified: false }],
    ])
    mockUseEditorStore.mockReturnValue({
      files,
      openFiles: ['src/a.ts', 'src/b.ts'],
      activeFilePath: 'src/a.ts',
      setActiveFile: vi.fn(),
      closeFile: vi.fn(),
    } as unknown as ReturnType<typeof useEditorStore>)

    render(<TabBar />)
    const tabA = screen.getByText('a.ts').closest('button')!
    const tabB = screen.getByText('b.ts').closest('button')!
    expect(tabA).toHaveClass('bg-background')
    expect(tabB).toHaveClass('text-muted-foreground')
  })

  it('calls setActiveFile on tab click', () => {
    const setActiveFile = vi.fn()
    const files = new Map([
      ['src/a.ts', { name: 'a.ts', content: '', language: 'typescript', isModified: false }],
    ])
    mockUseEditorStore.mockReturnValue({
      files,
      openFiles: ['src/a.ts'],
      activeFilePath: null,
      setActiveFile,
      closeFile: vi.fn(),
    } as unknown as ReturnType<typeof useEditorStore>)

    render(<TabBar />)
    fireEvent.click(screen.getByText('a.ts'))
    expect(setActiveFile).toHaveBeenCalledWith('src/a.ts')
  })

  it('calls closeFile on close button click', () => {
    const closeFile = vi.fn()
    const files = new Map([
      ['src/a.ts', { name: 'a.ts', content: '', language: 'typescript', isModified: false }],
    ])
    mockUseEditorStore.mockReturnValue({
      files,
      openFiles: ['src/a.ts'],
      activeFilePath: 'src/a.ts',
      setActiveFile: vi.fn(),
      closeFile,
    } as unknown as ReturnType<typeof useEditorStore>)

    const { container } = render(<TabBar />)
    const closeBtn = container.querySelector('.ml-1.p-0\\.5')!
    fireEvent.click(closeBtn)
    expect(closeFile).toHaveBeenCalledWith('src/a.ts')
  })

  it('shows modified indicator', () => {
    const files = new Map([
      ['src/a.ts', { name: 'a.ts', content: '', language: 'typescript', isModified: true }],
    ])
    mockUseEditorStore.mockReturnValue({
      files,
      openFiles: ['src/a.ts'],
      activeFilePath: 'src/a.ts',
      setActiveFile: vi.fn(),
      closeFile: vi.fn(),
    } as unknown as ReturnType<typeof useEditorStore>)

    const { container } = render(<TabBar />)
    expect(container.querySelector('.text-blue-400')).toBeInTheDocument()
  })
})
