import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TerminalPanel } from '../TerminalPanel'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('../../../stores/sandbox-store', () => ({
  useSandboxStore: Object.assign(vi.fn(), { getState: vi.fn() }),
}))

const originalWindow = { ...window }
vi.stubGlobal('window', {
  ...originalWindow,
  api: {
    sandbox: {
      onOutput: vi.fn(() => vi.fn()),
    },
  },
})

const { useSandboxStore } = await import('../../../stores/sandbox-store')
const mockUseSandboxStore = vi.mocked(useSandboxStore)

beforeEach(() => {
  vi.clearAllMocks()
  mockUseSandboxStore.mockReturnValue({
    executions: new Map(),
    activeExecutionId: null,
    clearAll: vi.fn(),
  } as unknown as ReturnType<typeof useSandboxStore>)
  mockUseSandboxStore.getState.mockReturnValue({
    appendOutput: vi.fn(),
  })
})

describe('TerminalPanel', () => {
  it('renders terminal header', () => {
    render(<TerminalPanel />)
    expect(screen.getByText('editor.terminal')).toBeInTheDocument()
  })

  it('shows waiting message when no active execution', () => {
    render(<TerminalPanel />)
    expect(screen.getByText('editor.waiting')).toBeInTheDocument()
  })

  it('shows output lines for active execution', () => {
    const executions = new Map([
      ['exec-1', {
        id: 'exec-1',
        language: 'python',
        code: 'print("hi")',
        status: 'completed' as const,
        output: [
          { type: 'stdout' as const, content: 'hello world', timestamp: 1 },
          { type: 'stderr' as const, content: 'some error', timestamp: 2 },
        ],
      }],
    ])
    mockUseSandboxStore.mockReturnValue({
      executions,
      activeExecutionId: 'exec-1',
      clearAll: vi.fn(),
    } as unknown as ReturnType<typeof useSandboxStore>)

    render(<TerminalPanel />)
    expect(screen.getByText('hello world')).toBeInTheDocument()
    expect(screen.getByText('some error')).toBeInTheDocument()
  })

  it('shows running indicator', () => {
    const executions = new Map([
      ['exec-1', {
        id: 'exec-1',
        language: 'python',
        code: 'print("hi")',
        status: 'running' as const,
        output: [],
      }],
    ])
    mockUseSandboxStore.mockReturnValue({
      executions,
      activeExecutionId: 'exec-1',
      clearAll: vi.fn(),
    } as unknown as ReturnType<typeof useSandboxStore>)

    const { container } = render(<TerminalPanel />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows exit code line', () => {
    const executions = new Map([
      ['exec-1', {
        id: 'exec-1',
        language: 'python',
        code: '',
        status: 'completed' as const,
        exitCode: 0,
        output: [
          { type: 'exit' as const, content: '', exitCode: 0, timestamp: 3 },
        ],
      }],
    ])
    mockUseSandboxStore.mockReturnValue({
      executions,
      activeExecutionId: 'exec-1',
      clearAll: vi.fn(),
    } as unknown as ReturnType<typeof useSandboxStore>)

    render(<TerminalPanel />)
    expect(screen.getByText('editor.processExit')).toBeInTheDocument()
  })

  it('applies collapsed height', () => {
    const { container } = render(<TerminalPanel isCollapsed />)
    expect(container.firstChild).toHaveClass('h-8')
  })

  it('applies expanded height', () => {
    const { container } = render(<TerminalPanel isCollapsed={false} />)
    expect(container.firstChild).toHaveClass('h-48')
  })

  it('calls onToggleCollapse on button click', () => {
    const onToggleCollapse = vi.fn()
    render(<TerminalPanel onToggleCollapse={onToggleCollapse} />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[buttons.length - 1])
    expect(onToggleCollapse).toHaveBeenCalled()
  })

  it('calls clearAll on trash button click', () => {
    const clearAll = vi.fn()
    const executions = new Map([
      ['exec-1', { id: 'exec-1', language: 'python', code: '', status: 'completed' as const, output: [] }],
    ])
    mockUseSandboxStore.mockReturnValue({
      executions,
      activeExecutionId: 'exec-1',
      clearAll,
    } as unknown as ReturnType<typeof useSandboxStore>)

    render(<TerminalPanel />)
    const trashButton = screen.getByTitle('editor.clearAll')
    fireEvent.click(trashButton)
    expect(clearAll).toHaveBeenCalled()
  })

  it('shows language label for active execution', () => {
    const executions = new Map([
      ['exec-1', { id: 'exec-1', language: 'python', code: '', status: 'running' as const, output: [] }],
    ])
    mockUseSandboxStore.mockReturnValue({
      executions,
      activeExecutionId: 'exec-1',
      clearAll: vi.fn(),
    } as unknown as ReturnType<typeof useSandboxStore>)

    render(<TerminalPanel />)
    expect(screen.getByText('python')).toBeInTheDocument()
  })
})
