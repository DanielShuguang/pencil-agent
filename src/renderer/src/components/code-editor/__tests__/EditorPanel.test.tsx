import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { EditorPanel } from '../EditorPanel'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('@monaco-editor/react', () => ({
  default: (p: any) => React.createElement('div', { 'data-testid': 'editor' }, p.value),
  DiffEditor: () => React.createElement('div', { 'data-testid': 'diff-editor' }),
  __esModule: true,
}))

vi.mock('../../../stores/editor-store', () => ({
  useEditorStore: vi.fn(),
}))

const { useEditorStore } = await import('../../../stores/editor-store')
const mockUseEditorStore = vi.mocked(useEditorStore)

beforeEach(() => {
  vi.clearAllMocks()
  mockUseEditorStore.mockReturnValue({
    files: new Map(),
    activeFilePath: null,
    updateFileContent: vi.fn(),
    acceptChanges: vi.fn(),
    rejectChanges: vi.fn(),
  } as unknown as ReturnType<typeof useEditorStore>)
})

describe('EditorPanel', () => {
  it('shows placeholder when no active file', () => {
    render(<EditorPanel />)
    expect(screen.getByText('editor.openFileToEdit')).toBeInTheDocument()
  })

  it('renders editor for active file', () => {
    const files = new Map([
      ['src/index.ts', { path: 'src/index.ts', name: 'index.ts', content: 'const x = 1', language: 'typescript', isModified: false }],
    ])
    mockUseEditorStore.mockReturnValue({
      files,
      activeFilePath: 'src/index.ts',
      updateFileContent: vi.fn(),
      acceptChanges: vi.fn(),
      rejectChanges: vi.fn(),
    } as unknown as ReturnType<typeof useEditorStore>)

    render(<EditorPanel />)
    expect(screen.getByTestId('editor')).toBeInTheDocument()
    expect(screen.getByText('const x = 1')).toBeInTheDocument()
  })

  it('renders DiffEditor when file is modified with originalContent', () => {
    const files = new Map([
      ['src/index.ts', { path: 'src/index.ts', name: 'index.ts', content: 'new content', language: 'typescript', originalContent: 'old content', isModified: true }],
    ])
    mockUseEditorStore.mockReturnValue({
      files,
      activeFilePath: 'src/index.ts',
      updateFileContent: vi.fn(),
      acceptChanges: vi.fn(),
      rejectChanges: vi.fn(),
    } as unknown as ReturnType<typeof useEditorStore>)

    render(<EditorPanel />)
    expect(screen.getByTestId('diff-editor')).toBeInTheDocument()
  })

  it('shows accept/reject buttons when diff is visible', () => {
    const files = new Map([
      ['src/index.ts', { path: 'src/index.ts', name: 'index.ts', content: 'new', language: 'typescript', originalContent: 'old', isModified: true }],
    ])
    mockUseEditorStore.mockReturnValue({
      files,
      activeFilePath: 'src/index.ts',
      updateFileContent: vi.fn(),
      acceptChanges: vi.fn(),
      rejectChanges: vi.fn(),
    } as unknown as ReturnType<typeof useEditorStore>)

    render(<EditorPanel />)
    expect(screen.getByText('editor.acceptChanges')).toBeInTheDocument()
    expect(screen.getByText('editor.rejectChanges')).toBeInTheDocument()
  })

  it('calls acceptChanges on accept click', () => {
    const acceptChanges = vi.fn()
    const files = new Map([
      ['src/index.ts', { path: 'src/index.ts', name: 'index.ts', content: 'new', language: 'typescript', originalContent: 'old', isModified: true }],
    ])
    mockUseEditorStore.mockReturnValue({
      files,
      activeFilePath: 'src/index.ts',
      updateFileContent: vi.fn(),
      acceptChanges,
      rejectChanges: vi.fn(),
    } as unknown as ReturnType<typeof useEditorStore>)

    render(<EditorPanel />)
    fireEvent.click(screen.getByText('editor.acceptChanges'))
    expect(acceptChanges).toHaveBeenCalledWith('src/index.ts')
  })

  it('calls rejectChanges on reject click', () => {
    const rejectChanges = vi.fn()
    const files = new Map([
      ['src/index.ts', { path: 'src/index.ts', name: 'index.ts', content: 'new', language: 'typescript', originalContent: 'old', isModified: true }],
    ])
    mockUseEditorStore.mockReturnValue({
      files,
      activeFilePath: 'src/index.ts',
      updateFileContent: vi.fn(),
      acceptChanges: vi.fn(),
      rejectChanges,
    } as unknown as ReturnType<typeof useEditorStore>)

    render(<EditorPanel />)
    fireEvent.click(screen.getByText('editor.rejectChanges'))
    expect(rejectChanges).toHaveBeenCalledWith('src/index.ts')
  })

  it('applies className prop', () => {
    const { container } = render(<EditorPanel className='custom-class' />)
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
