import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FileTree } from '../FileTree'
import '../../../i18n'

vi.mock('../../../stores/editor-store', () => ({
  useEditorStore: vi.fn(),
}))

const { useEditorStore } = await import('../../../stores/editor-store')
const mockUseEditorStore = vi.mocked(useEditorStore)

beforeEach(() => {
  mockUseEditorStore.mockReturnValue({
    files: new Map(),
    openFile: vi.fn(),
  } as unknown as ReturnType<typeof useEditorStore>)
})

describe('FileTree', () => {
  it('shows empty message when no files', () => {
    render(<FileTree />)
    expect(screen.getByText('暂无打开的文件')).toBeInTheDocument()
  })

  it('renders file names', () => {
    const files = new Map([
      ['src/index.ts', { content: '', language: 'typescript' }],
      ['src/utils.ts', { content: '', language: 'typescript' }],
    ])
    mockUseEditorStore.mockReturnValue({
      files,
      openFile: vi.fn(),
    } as unknown as ReturnType<typeof useEditorStore>)

    render(<FileTree />)
    expect(screen.getByText('index.ts')).toBeInTheDocument()
    expect(screen.getByText('utils.ts')).toBeInTheDocument()
  })

  it('renders directory structure', () => {
    const files = new Map([
      ['src/components/App.tsx', { content: '', language: 'typescript' }],
      ['src/lib/utils.ts', { content: '', language: 'typescript' }],
    ])
    mockUseEditorStore.mockReturnValue({
      files,
      openFile: vi.fn(),
    } as unknown as ReturnType<typeof useEditorStore>)

    render(<FileTree />)
    expect(screen.getByText('src')).toBeInTheDocument()
    expect(screen.getByText('components')).toBeInTheDocument()
    expect(screen.getByText('lib')).toBeInTheDocument()
    expect(screen.getByText('App.tsx')).toBeInTheDocument()
    expect(screen.getByText('utils.ts')).toBeInTheDocument()
  })

  it('calls openFile on file click', () => {
    const openFile = vi.fn()
    const files = new Map([
      ['src/index.ts', { content: 'const x = 1', language: 'typescript' }],
    ])
    mockUseEditorStore.mockReturnValue({
      files,
      openFile,
    } as unknown as ReturnType<typeof useEditorStore>)

    render(<FileTree />)
    fireEvent.click(screen.getByText('index.ts'))
    expect(openFile).toHaveBeenCalledWith('src/index.ts', 'const x = 1', 'typescript')
  })

  it('toggles directory expand/collapse', () => {
    const files = new Map([
      ['src/index.ts', { content: '', language: 'typescript' }],
    ])
    mockUseEditorStore.mockReturnValue({
      files,
      openFile: vi.fn(),
    } as unknown as ReturnType<typeof useEditorStore>)

    render(<FileTree />)
    const dirButton = screen.getByText('src')
    
    // Directory is expanded by default, file is visible
    expect(screen.getByText('index.ts')).toBeInTheDocument()
    
    // Click to collapse
    fireEvent.click(dirButton)
    expect(screen.queryByText('index.ts')).not.toBeInTheDocument()
    
    // Click to expand
    fireEvent.click(dirButton)
    expect(screen.getByText('index.ts')).toBeInTheDocument()
  })

  it('handles deeply nested files', () => {
    const files = new Map([
      ['a/b/c/d/file.txt', { content: '', language: 'text' }],
    ])
    mockUseEditorStore.mockReturnValue({
      files,
      openFile: vi.fn(),
    } as unknown as ReturnType<typeof useEditorStore>)

    render(<FileTree />)
    expect(screen.getByText('a')).toBeInTheDocument()
    expect(screen.getByText('b')).toBeInTheDocument()
    expect(screen.getByText('c')).toBeInTheDocument()
    expect(screen.getByText('d')).toBeInTheDocument()
    expect(screen.getByText('file.txt')).toBeInTheDocument()
  })

  it('handles multiple files in same directory', () => {
    const files = new Map([
      ['src/a.ts', { content: '', language: 'typescript' }],
      ['src/b.ts', { content: '', language: 'typescript' }],
      ['src/c.ts', { content: '', language: 'typescript' }],
    ])
    mockUseEditorStore.mockReturnValue({
      files,
      openFile: vi.fn(),
    } as unknown as ReturnType<typeof useEditorStore>)

    render(<FileTree />)
    expect(screen.getByText('a.ts')).toBeInTheDocument()
    expect(screen.getByText('b.ts')).toBeInTheDocument()
    expect(screen.getByText('c.ts')).toBeInTheDocument()
  })
})
