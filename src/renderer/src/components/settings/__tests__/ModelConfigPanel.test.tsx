import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ModelConfigPanel } from '../ModelConfigPanel'

const mockFetchProviders = vi.fn()
const mockSaveProvider = vi.fn()
const mockDeleteProvider = vi.fn()
const mockSaveModel = vi.fn()
const mockDeleteModel = vi.fn()
const mockTestConnection = vi.fn()

vi.mock('../../../stores/model-config-store', () => ({
  useModelConfigStore: vi.fn(() => ({
    providers: [],
    isLoading: false,
    error: null,
    fetchProviders: mockFetchProviders,
    saveProvider: mockSaveProvider,
    deleteProvider: mockDeleteProvider,
    saveModel: mockSaveModel,
    deleteModel: mockDeleteModel,
    testConnection: mockTestConnection,
  })),
}))

vi.mock('../ProviderForm', () => ({
  ProviderForm: ({ onSave, onCancel }: { onSave: (...args: unknown[]) => void; onCancel: () => void }) => (
    <div data-testid='provider-form'>
      <button onClick={() => onSave({ id: 'new', name: 'New', baseUrl: '', apiKey: '', models: [] })}>
        Save Provider
      </button>
      <button onClick={onCancel}>Cancel Provider</button>
    </div>
  ),
}))

vi.mock('../ModelForm', () => ({
  ModelForm: ({ onSave, onCancel }: { onSave: (...args: unknown[]) => void; onCancel: () => void }) => (
    <div data-testid='model-form'>
      <button onClick={() => onSave({ id: 'model-1', name: 'Model 1', providerId: 'openai' })}>
        Save Model
      </button>
      <button onClick={onCancel}>Cancel Model</button>
    </div>
  ),
}))

import { useModelConfigStore } from '../../../stores/model-config-store'

describe('ModelConfigPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useModelConfigStore).mockReturnValue({
      providers: [],
      isLoading: false,
      error: null,
      fetchProviders: mockFetchProviders,
      saveProvider: mockSaveProvider,
      deleteProvider: mockDeleteProvider,
      saveModel: mockSaveModel,
      deleteModel: mockDeleteModel,
      testConnection: mockTestConnection,
    })
  })

  it('should fetch providers on mount', () => {
    render(<ModelConfigPanel />)
    expect(mockFetchProviders).toHaveBeenCalledTimes(1)
  })

  it('should show loading state', () => {
    vi.mocked(useModelConfigStore).mockReturnValue({
      providers: [],
      isLoading: true,
      error: null,
      fetchProviders: mockFetchProviders,
      saveProvider: mockSaveProvider,
      deleteProvider: mockDeleteProvider,
      saveModel: mockSaveModel,
      deleteModel: mockDeleteModel,
      testConnection: mockTestConnection,
    })

    render(<ModelConfigPanel />)
    expect(screen.getByText('加载中...')).toBeInTheDocument()
  })

  it('should show empty state', () => {
    render(<ModelConfigPanel />)
    expect(screen.getByText('暂无供应商')).toBeInTheDocument()
  })

  it('should show error message', () => {
    vi.mocked(useModelConfigStore).mockReturnValue({
      providers: [],
      isLoading: false,
      error: 'Network error',
      fetchProviders: mockFetchProviders,
      saveProvider: mockSaveProvider,
      deleteProvider: mockDeleteProvider,
      saveModel: mockSaveModel,
      deleteModel: mockDeleteModel,
      testConnection: mockTestConnection,
    })

    render(<ModelConfigPanel />)
    expect(screen.getByText('Network error')).toBeInTheDocument()
  })

  it('should show provider list', () => {
    vi.mocked(useModelConfigStore).mockReturnValue({
      providers: [
        {
          id: 'openai',
          name: 'OpenAI',
          baseUrl: 'https://api.openai.com/v1',
          models: [{ id: 'gpt-4o', name: 'GPT-4o', providerId: 'openai' }],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      isLoading: false,
      error: null,
      fetchProviders: mockFetchProviders,
      saveProvider: mockSaveProvider,
      deleteProvider: mockDeleteProvider,
      saveModel: mockSaveModel,
      deleteModel: mockDeleteModel,
      testConnection: mockTestConnection,
    })

    render(<ModelConfigPanel />)
    expect(screen.getByText('OpenAI')).toBeInTheDocument()
    expect(screen.getByText('（1 个模型）')).toBeInTheDocument()
  })

  it('should show ProviderForm when adding provider', async () => {
    const user = userEvent.setup()
    render(<ModelConfigPanel />)

    await user.click(screen.getByText('添加供应商'))
    expect(screen.getByTestId('provider-form')).toBeInTheDocument()
    expect(screen.getByText('添加供应商', { selector: 'h3' })).toBeInTheDocument()
  })

  it('should save provider and close form', async () => {
    const user = userEvent.setup()
    render(<ModelConfigPanel />)

    await user.click(screen.getByText('添加供应商'))
    await user.click(screen.getByText('Save Provider'))

    expect(mockSaveProvider).toHaveBeenCalled()
    expect(screen.queryByTestId('provider-form')).not.toBeInTheDocument()
  })

  it('should cancel adding provider', async () => {
    const user = userEvent.setup()
    render(<ModelConfigPanel />)

    await user.click(screen.getByText('添加供应商'))
    await user.click(screen.getByText('Cancel Provider'))

    expect(screen.queryByTestId('provider-form')).not.toBeInTheDocument()
  })

  it('should expand provider to show models', async () => {
    vi.mocked(useModelConfigStore).mockReturnValue({
      providers: [
        {
          id: 'openai',
          name: 'OpenAI',
          baseUrl: 'https://api.openai.com/v1',
          models: [{ id: 'gpt-4o', name: 'GPT-4o', providerId: 'openai' }],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      isLoading: false,
      error: null,
      fetchProviders: mockFetchProviders,
      saveProvider: mockSaveProvider,
      deleteProvider: mockDeleteProvider,
      saveModel: mockSaveModel,
      deleteModel: mockDeleteModel,
      testConnection: mockTestConnection,
    })

    const user = userEvent.setup()
    render(<ModelConfigPanel />)

    await user.click(screen.getByText('OpenAI'))
    expect(screen.getByText('模型列表')).toBeInTheDocument()
    expect(screen.getByText('GPT-4o')).toBeInTheDocument()
  })

  it('should show ModelForm when adding model', async () => {
    vi.mocked(useModelConfigStore).mockReturnValue({
      providers: [
        {
          id: 'openai',
          name: 'OpenAI',
          baseUrl: 'https://api.openai.com/v1',
          models: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      isLoading: false,
      error: null,
      fetchProviders: mockFetchProviders,
      saveProvider: mockSaveProvider,
      deleteProvider: mockDeleteProvider,
      saveModel: mockSaveModel,
      deleteModel: mockDeleteModel,
      testConnection: mockTestConnection,
    })

    const user = userEvent.setup()
    render(<ModelConfigPanel />)

    await user.click(screen.getByText('OpenAI'))
    await user.click(screen.getByText('添加模型'))

    expect(screen.getByTestId('model-form')).toBeInTheDocument()
  })

  it('should show ProviderForm when editing provider', async () => {
    vi.mocked(useModelConfigStore).mockReturnValue({
      providers: [
        {
          id: 'openai',
          name: 'OpenAI',
          baseUrl: 'https://api.openai.com/v1',
          models: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      isLoading: false,
      error: null,
      fetchProviders: mockFetchProviders,
      saveProvider: mockSaveProvider,
      deleteProvider: mockDeleteProvider,
      saveModel: mockSaveModel,
      deleteModel: mockDeleteModel,
      testConnection: mockTestConnection,
    })

    const user = userEvent.setup()
    render(<ModelConfigPanel />)

    const editButtons = screen.getAllByRole('button')
    const editButton = editButtons.find((btn) => btn.querySelector('.lucide-pencil'))
    if (editButton) await user.click(editButton)

    expect(screen.getByText('编辑供应商', { selector: 'h3' })).toBeInTheDocument()
  })

  it('should call testConnection', async () => {
    mockTestConnection.mockResolvedValue({ success: true })
    vi.mocked(useModelConfigStore).mockReturnValue({
      providers: [
        {
          id: 'openai',
          name: 'OpenAI',
          baseUrl: 'https://api.openai.com/v1',
          models: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      isLoading: false,
      error: null,
      fetchProviders: mockFetchProviders,
      saveProvider: mockSaveProvider,
      deleteProvider: mockDeleteProvider,
      saveModel: mockSaveModel,
      deleteModel: mockDeleteModel,
      testConnection: mockTestConnection,
    })

    const user = userEvent.setup()
    render(<ModelConfigPanel />)

    const testButtons = screen.getAllByRole('button')
    const testButton = testButtons.find((btn) => btn.querySelector('.lucide-test-tube'))
    if (testButton) await user.click(testButton)

    expect(mockTestConnection).toHaveBeenCalledWith('openai')
  })
})
