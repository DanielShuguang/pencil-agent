import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StatusBar } from '../StatusBar'
import { useStatusStore } from '../../../stores/status-store'
import { useAgentStore } from '../../../stores/agent-store'

vi.mock('../../../stores/status-store', () => ({
  useStatusStore: vi.fn(),
}))

vi.mock('../../../stores/agent-store', () => ({
  useAgentStore: vi.fn(),
}))

vi.mock('../../chat/ModelSelector', () => ({
  ModelSelector: () => <div data-testid='model-selector'>Model Selector</div>,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'status.connected': '已连接',
        'status.disconnected': '已断开',
        'status.checking': '检查中...',
        'status.tokenUsage': 'Token 用量',
        'status.prompt': '提示：',
        'status.completion': '补全：',
        'status.total': '总计：',
      }
      return translations[key] || key
    },
  }),
}))

describe('StatusBar', () => {
  const mockCheckConnection = vi.fn()
  const mockSyncFromAgentStore = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useStatusStore).mockReturnValue({
      currentModel: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
      tokenUsage: { prompt: 1000, completion: 500, total: 1500 },
      connectionStatus: 'connected',
      lastChecked: Date.now(),
      version: '1.0.0',
      isGenerating: false,
      checkConnection: mockCheckConnection,
      syncFromAgentStore: mockSyncFromAgentStore,
      incrementTokenUsage: vi.fn(),
      resetTokenUsage: vi.fn(),
      init: vi.fn(),
    })

    vi.mocked(useAgentStore).mockReturnValue({
      currentModel: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
      isGenerating: false,
      activeSessionId: 's1',
      sessionMetas: new Map([
        ['s1', { id: 's1', title: 'Test', model: { id: 'm', provider: 'p' }, cwd: '/Users/dev/frontend', updatedAt: 0, createdAt: 0, messageCount: 0 }],
      ]),
    })
  })

  it('should render all subcomponents', () => {
    render(<StatusBar />)

    expect(screen.getByText('claude-sonnet-4-20250514')).toBeInTheDocument()
    expect(screen.getByText('1.5K')).toBeInTheDocument()
    expect(screen.getByText('已连接')).toBeInTheDocument()
    expect(screen.getByText('v1.0.0')).toBeInTheDocument()
  })

  it('should open model selector on click', () => {
    render(<StatusBar />)

    fireEvent.click(screen.getByText('claude-sonnet-4-20250514'))

    expect(screen.getByTestId('model-selector')).toBeInTheDocument()
  })

  it('should close model selector on Escape key', () => {
    render(<StatusBar />)

    fireEvent.click(screen.getByText('claude-sonnet-4-20250514'))
    expect(screen.getByTestId('model-selector')).toBeInTheDocument()

    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(screen.queryByTestId('model-selector')).not.toBeInTheDocument()
  })

  it('should show token details on click', () => {
    render(<StatusBar />)

    fireEvent.click(screen.getByText('1.5K'))

    expect(screen.getByText('Token 用量')).toBeInTheDocument()
    expect(screen.getByText('1.0K')).toBeInTheDocument()
    expect(screen.getByText('500')).toBeInTheDocument()
  })

  it('should trigger connection check on click', () => {
    render(<StatusBar />)

    fireEvent.click(screen.getByText('已连接'))

    expect(mockCheckConnection).toHaveBeenCalled()
  })

  it('should show disconnected status', () => {
    vi.mocked(useStatusStore).mockReturnValue({
      currentModel: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
      tokenUsage: { prompt: 0, completion: 0, total: 0 },
      connectionStatus: 'disconnected',
      lastChecked: Date.now(),
      version: '1.0.0',
      isGenerating: false,
      checkConnection: mockCheckConnection,
      syncFromAgentStore: mockSyncFromAgentStore,
      incrementTokenUsage: vi.fn(),
      resetTokenUsage: vi.fn(),
      init: vi.fn(),
    })

    render(<StatusBar />)

    expect(screen.getByText('已断开')).toBeInTheDocument()
  })

  it('should show checking status with spinner', () => {
    vi.mocked(useStatusStore).mockReturnValue({
      currentModel: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
      tokenUsage: { prompt: 0, completion: 0, total: 0 },
      connectionStatus: 'checking',
      lastChecked: 0,
      version: '1.0.0',
      isGenerating: false,
      checkConnection: mockCheckConnection,
      syncFromAgentStore: mockSyncFromAgentStore,
      incrementTokenUsage: vi.fn(),
      resetTokenUsage: vi.fn(),
      init: vi.fn(),
    })

    render(<StatusBar />)

    expect(screen.getByText('检查中...')).toBeInTheDocument()
  })

  it('should show generating state', () => {
    vi.mocked(useStatusStore).mockReturnValue({
      currentModel: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
      tokenUsage: { prompt: 100, completion: 50, total: 150 },
      connectionStatus: 'connected',
      lastChecked: Date.now(),
      version: '1.0.0',
      isGenerating: true,
      checkConnection: mockCheckConnection,
      syncFromAgentStore: mockSyncFromAgentStore,
      incrementTokenUsage: vi.fn(),
      resetTokenUsage: vi.fn(),
      init: vi.fn(),
    })

    render(<StatusBar />)

    const modelButton = screen.getByText('claude-sonnet-4-20250514').closest('button')
    expect(modelButton).toHaveClass('text-primary')
  })

  it('should display workspace path when active session has cwd', () => {
    render(<StatusBar />)
    expect(screen.getByText('/Users/dev/frontend')).toBeInTheDocument()
  })

  it('should not display workspace path when no active session', () => {
    vi.mocked(useAgentStore).mockReturnValue({
      currentModel: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
      isGenerating: false,
      activeSessionId: null,
      sessionMetas: new Map(),
    })

    render(<StatusBar />)
    expect(screen.queryByText('/Users/dev/frontend')).not.toBeInTheDocument()
  })
})
