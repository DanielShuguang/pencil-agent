import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ModelSelector } from '../ModelSelector'
import '../../../i18n'

vi.mock('../../../stores/agent-store', () => ({
  useAgentStore: vi.fn(),
}))

vi.mock('../../../stores/model-config-store', () => ({
  useModelConfigStore: vi.fn(),
}))

const { useAgentStore } = await import('../../../stores/agent-store')
const { useModelConfigStore } = await import('../../../stores/model-config-store')

const mockUseAgentStore = vi.mocked(useAgentStore)
const mockUseModelConfigStore = vi.mocked(useModelConfigStore)

const mockProviders = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
      { id: 'claude-opus-4-20250514', name: 'Claude Opus 4' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com',
    models: [{ id: 'gpt-4o', name: 'GPT-4o' }],
  },
]

beforeEach(() => {
  mockUseAgentStore.mockReturnValue({
    activeSessionId: 'session-1',
    sessionMetas: new Map([
      ['session-1', { currentModel: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' } }],
    ]),
    defaultModel: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
    switchSessionModel: vi.fn(),
    switchDefaultModel: vi.fn(),
  } as unknown as ReturnType<typeof useAgentStore>)

  mockUseModelConfigStore.mockReturnValue({
    providers: mockProviders,
    fetchProviders: vi.fn(),
  } as unknown as ReturnType<typeof useModelConfigStore>)
})

describe('ModelSelector', () => {
  it('renders current model name', () => {
    render(<ModelSelector />)
    expect(screen.getByText('Claude Sonnet 4')).toBeInTheDocument()
  })

  it('renders current provider name', () => {
    render(<ModelSelector />)
    expect(screen.getByText('Anthropic')).toBeInTheDocument()
  })

  it('opens dropdown on click', async () => {
    const user = userEvent.setup()
    render(<ModelSelector />)
    await user.click(screen.getByText('Claude Sonnet 4'))
    expect(screen.getByPlaceholderText('搜索模型...')).toBeInTheDocument()
  })

  it('shows all providers and models when opened', async () => {
    const user = userEvent.setup()
    render(<ModelSelector />)
    await user.click(screen.getByText('Claude Sonnet 4'))
    expect(screen.getByText('Claude Opus 4')).toBeInTheDocument()
    expect(screen.getByText('GPT-4o')).toBeInTheDocument()
  })

  it('calls switchSessionModel on selection', async () => {
    const switchSessionModel = vi.fn()
    mockUseAgentStore.mockReturnValue({
      activeSessionId: 'session-1',
      sessionMetas: new Map([
        ['session-1', { currentModel: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' } }],
      ]),
      defaultModel: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
      switchSessionModel,
      switchDefaultModel: vi.fn(),
    } as unknown as ReturnType<typeof useAgentStore>)

    const user = userEvent.setup()
    render(<ModelSelector />)
    await user.click(screen.getByText('Claude Sonnet 4'))
    await user.click(screen.getByText('GPT-4o'))
    expect(switchSessionModel).toHaveBeenCalledWith({ id: 'gpt-4o', provider: 'openai' })
  })

  it('filters models by search query', async () => {
    const user = userEvent.setup()
    render(<ModelSelector />)
    await user.click(screen.getByText('Claude Sonnet 4'))
    await user.type(screen.getByPlaceholderText('搜索模型...'), 'opus')
    expect(screen.queryByText('GPT-4o')).not.toBeInTheDocument()
    expect(screen.getByText('Claude Opus 4')).toBeInTheDocument()
  })

  it('shows not found message when no models match', async () => {
    const user = userEvent.setup()
    render(<ModelSelector />)
    await user.click(screen.getByText('Claude Sonnet 4'))
    await user.type(screen.getByPlaceholderText('搜索模型...'), 'nonexistent')
    expect(screen.getByText('未找到模型')).toBeInTheDocument()
  })

  it('renders inline mode when showTrigger is false', () => {
    render(<ModelSelector showTrigger={false} />)
    expect(screen.getByPlaceholderText('搜索模型...')).toBeInTheDocument()
    expect(screen.getByText('Claude Opus 4')).toBeInTheDocument()
  })

  it('highlights current model', async () => {
    const user = userEvent.setup()
    render(<ModelSelector />)
    await user.click(screen.getByText('Claude Sonnet 4'))
    const buttons = screen.getAllByText('Claude Sonnet 4')
    const dropdownButton = buttons[1].closest('button')
    expect(dropdownButton?.className).toContain('bg-primary')
  })
})
