import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuditLogPanel } from '../AuditLogPanel'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('../../../stores/agent-store', () => ({
  useAgentStore: vi.fn(),
}))

const { useAgentStore } = await import('../../../stores/agent-store')
const mockUseAgentStore = vi.mocked(useAgentStore)

const mockGetLogs = vi.fn().mockResolvedValue([])
const mockClearLogs = vi.fn().mockResolvedValue(undefined)

Object.defineProperty(window, 'api', {
  value: {
    audit: {
      getLogs: mockGetLogs,
      clearLogs: mockClearLogs,
    },
  },
  writable: true,
})

const sampleLogs = [
  {
    id: 'log-1',
    sessionId: 'session-1',
    timestamp: Date.now(),
    toolName: 'file_read',
    parameters: { path: '/test' },
    status: 'success' as const,
    result: 'file content',
    duration: 150,
  },
  {
    id: 'log-2',
    sessionId: 'session-1',
    timestamp: Date.now(),
    toolName: 'shell_exec',
    parameters: { command: 'ls' },
    status: 'error' as const,
    error: 'command failed',
    duration: 2500,
  },
  {
    id: 'log-3',
    sessionId: 'session-1',
    timestamp: Date.now(),
    toolName: 'network_request',
    parameters: { url: 'https://example.com' },
    status: 'denied' as const,
    duration: 50,
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockGetLogs.mockResolvedValue([])
  mockUseAgentStore.mockReturnValue({
    activeSessionId: 'session-1',
  } as unknown as ReturnType<typeof useAgentStore>)
})

describe('AuditLogPanel', () => {
  it('shows empty state when no logs', async () => {
    render(<AuditLogPanel />)
    await waitFor(() => {
      expect(screen.getByText('common.noData')).toBeInTheDocument()
    })
  })

  it('calls getLogs on mount with activeSessionId', async () => {
    render(<AuditLogPanel />)
    await waitFor(() => {
      expect(mockGetLogs).toHaveBeenCalledWith('session-1')
    })
  })

  it('does not call getLogs when no activeSessionId', async () => {
    mockUseAgentStore.mockReturnValue({
      activeSessionId: null,
    } as unknown as ReturnType<typeof useAgentStore>)
    render(<AuditLogPanel />)
    await waitFor(() => {
      expect(mockGetLogs).not.toHaveBeenCalled()
    })
  })

  it('renders log entries', async () => {
    mockGetLogs.mockResolvedValue(sampleLogs)
    render(<AuditLogPanel />)
    await waitFor(() => {
      expect(screen.getByText('file_read')).toBeInTheDocument()
      expect(screen.getByText('shell_exec')).toBeInTheDocument()
      expect(screen.getByText('network_request')).toBeInTheDocument()
    })
  })

  it('expands log entry on click and shows details', async () => {
    mockGetLogs.mockResolvedValue(sampleLogs)
    const user = userEvent.setup()
    render(<AuditLogPanel />)
    await waitFor(() => {
      expect(screen.getByText('file_read')).toBeInTheDocument()
    })
    await user.click(screen.getByText('file_read'))
    expect(screen.getByText('permission.parameters')).toBeInTheDocument()
    expect(screen.getByText('permission.result')).toBeInTheDocument()
  })

  it('shows error details for error status', async () => {
    mockGetLogs.mockResolvedValue(sampleLogs)
    const user = userEvent.setup()
    render(<AuditLogPanel />)
    await waitFor(() => {
      expect(screen.getByText('shell_exec')).toBeInTheDocument()
    })
    await user.click(screen.getByText('shell_exec'))
    expect(screen.getByText('permission.error')).toBeInTheDocument()
    expect(screen.getByText('command failed')).toBeInTheDocument()
  })

  it('collapses expanded entry on second click', async () => {
    mockGetLogs.mockResolvedValue(sampleLogs)
    const user = userEvent.setup()
    render(<AuditLogPanel />)
    await waitFor(() => {
      expect(screen.getByText('file_read')).toBeInTheDocument()
    })
    await user.click(screen.getByText('file_read'))
    expect(screen.getByText('permission.parameters')).toBeInTheDocument()
    await user.click(screen.getByText('file_read'))
    expect(screen.queryByText('permission.parameters')).not.toBeInTheDocument()
  })

  it('calls clearLogs on clear button click', async () => {
    mockGetLogs.mockResolvedValue(sampleLogs)
    const user = userEvent.setup()
    render(<AuditLogPanel />)
    await waitFor(() => {
      expect(screen.getByText('file_read')).toBeInTheDocument()
    })
    const clearButton = screen.getAllByRole('button').find((b) =>
      b.querySelector('.lucide-trash-2'),
    )
    expect(clearButton).toBeDefined()
    await user.click(clearButton!)
    expect(mockClearLogs).toHaveBeenCalled()
  })

  it('refreshes logs on refresh button click', async () => {
    mockGetLogs.mockResolvedValue(sampleLogs)
    const user = userEvent.setup()
    render(<AuditLogPanel />)
    await waitFor(() => {
      expect(mockGetLogs).toHaveBeenCalledTimes(1)
    })
    await user.click(screen.getByText('common.refresh'))
    expect(mockGetLogs).toHaveBeenCalledTimes(2)
  })

  it('displays duration formatted correctly', async () => {
    mockGetLogs.mockResolvedValue(sampleLogs)
    render(<AuditLogPanel />)
    await waitFor(() => {
      expect(screen.getByText('150ms')).toBeInTheDocument()
      expect(screen.getByText('2.5s')).toBeInTheDocument()
    })
  })
})
