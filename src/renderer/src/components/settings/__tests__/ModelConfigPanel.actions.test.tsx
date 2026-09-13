import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TooltipProvider } from '../../ui/tooltip'
import { ModelConfigPanel } from '../ModelConfigPanel'

const storeMocks = vi.hoisted(() => ({
  fetchProviders: vi.fn(),
  saveProvider: vi.fn().mockResolvedValue(undefined),
  deleteProvider: vi.fn().mockResolvedValue(undefined),
  saveModel: vi.fn().mockResolvedValue(undefined),
  deleteModel: vi.fn().mockResolvedValue(undefined),
  testConnection: vi.fn().mockResolvedValue({ success: true }),
  fetchModels: vi.fn().mockResolvedValue({ models: [] }),
  toggleVisibility: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../../stores/model-config-store', () => ({
  useModelConfigStore: vi.fn(() => ({
    providers: [],
    isLoading: false,
    error: null,
    ...storeMocks,
  })),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === 'settings.modelsCount' && options?.count !== undefined) {
        return `（${options.count} 个模型）`
      }
      const translations: Record<string, string> = {
        'common.loading': '加载中...',
        'common.ok': '确定',
        'common.cancel': '取消',
        'settings.models': '模型',
        'settings.addProvider': '添加供应商',
        'settings.addModel': '添加模型',
        'settings.editModel': '编辑模型',
        'settings.noProviders': '暂无供应商',
        'settings.connected': '已连接',
        'settings.fetchModels': '获取模型',
        'settings.deleteModelConfirm': '确定删除此模型？',
        'settings.editProvider': '编辑供应商',
      }
      return translations[key] || key
    },
    i18n: { language: 'zh' },
  }),
}))

vi.mock('../ProviderForm', () => ({
  ProviderForm: ({
    provider,
    maskedApiKey,
    onSave,
    onCancel,
  }: {
    provider?: unknown
    maskedApiKey?: string
    onSave: (provider: unknown) => void
    onCancel: () => void
  }) => (
    <div data-testid='provider-form' data-masked={maskedApiKey ?? ''}>
      <button
        onClick={() =>
          onSave({
            id: provider ? 'openai' : 'new-provider',
            name: 'Provider',
            baseUrl: 'https://api.test.com/v1',
            apiKey: 'sk',
            apiFormat: 'openai',
            models: [],
          })
        }
      >
        Save Provider
      </button>
      <button onClick={onCancel}>Cancel Provider</button>
    </div>
  ),
}))

vi.mock('../ModelForm', () => ({
  ModelForm: ({
    onSave,
    onCancel,
  }: {
    onSave: (model: unknown) => void
    onCancel: () => void
  }) => (
    <div data-testid='model-form'>
      <button onClick={() => onSave({ id: 'model-new', name: 'New', providerId: 'openai' })}>
        Save Model
      </button>
      <button onClick={onCancel}>Cancel Model</button>
    </div>
  ),
}))

import { useModelConfigStore } from '../../../stores/model-config-store'

const providerInfo = {
  id: 'openai',
  name: 'OpenAI',
  baseUrl: 'https://api.openai.com/v1',
  apiFormat: 'openai' as const,
  models: [{ id: 'existing-model', name: 'Existing', providerId: 'openai' }],
  createdAt: 1,
  updatedAt: 1,
}

function setStoreState(overrides: Record<string, unknown> = {}) {
  vi.mocked(useModelConfigStore).mockReturnValue({
    providers: [providerInfo],
    isLoading: false,
    error: null,
    ...storeMocks,
    ...overrides,
  } as never)
}

function renderPanel() {
  return render(
    <TooltipProvider>
      <ModelConfigPanel />
    </TooltipProvider>,
  )
}

describe('ModelConfigPanel 操作', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storeMocks.saveProvider.mockResolvedValue(undefined)
    storeMocks.deleteProvider.mockResolvedValue(undefined)
    storeMocks.saveModel.mockResolvedValue(undefined)
    storeMocks.deleteModel.mockResolvedValue(undefined)
    storeMocks.fetchModels.mockResolvedValue({ models: [] })
    Object.defineProperty(window, 'api', {
      value: { settings: { getMaskedKey: vi.fn().mockResolvedValue(null) } },
      writable: true,
    })
    setStoreState()
  })

  describe('获取模型', () => {
    it('拉取到的新模型会被保存，已存在的跳过', async () => {
      storeMocks.fetchModels.mockResolvedValue({
        models: [
          { id: 'existing-model', name: 'Existing', providerId: 'openai' },
          { id: 'brand-new', name: 'Brand New', providerId: 'openai' },
        ],
      })
      renderPanel()
      const user = userEvent.setup()

      const fetchButton = screen
        .getAllByRole('button')
        .find((b) => b.querySelector('.lucide-download'))!
      await user.click(fetchButton)

      await waitFor(() => expect(storeMocks.fetchModels).toHaveBeenCalledWith('openai'))
      await waitFor(() => expect(storeMocks.saveModel).toHaveBeenCalledTimes(1))
      expect(storeMocks.saveModel).toHaveBeenCalledWith('openai', {
        id: 'brand-new',
        name: 'Brand New',
        providerId: 'openai',
      })
    })

    it('没有新模型时不保存', async () => {
      storeMocks.fetchModels.mockResolvedValue({ models: [] })
      renderPanel()
      const user = userEvent.setup()

      const fetchButton = screen
        .getAllByRole('button')
        .find((b) => b.querySelector('.lucide-download'))!
      await user.click(fetchButton)

      await waitFor(() => expect(storeMocks.fetchModels).toHaveBeenCalled())
      expect(storeMocks.saveModel).not.toHaveBeenCalled()
    })
  })

  describe('删除模型', () => {
    async function openModelList() {
      const user = userEvent.setup()
      renderPanel()
      await user.click(screen.getByText('OpenAI'))
      return user
    }

    it('点击删除模型弹出确认框并确认', async () => {
      const user = await openModelList()
      const deleteModelButton = screen
        .getAllByRole('button')
        .find((b) => b.querySelector('svg.h-3.w-3.lucide-trash-2'))!

      await user.click(deleteModelButton)
      expect(screen.getByText('确定删除此模型？')).toBeInTheDocument()

      await user.click(screen.getByText('确定'))
      await waitFor(() =>
        expect(storeMocks.deleteModel).toHaveBeenCalledWith('openai', 'existing-model'),
      )
    })

    it('取消删除模型不调用删除', async () => {
      const user = await openModelList()
      const deleteModelButton = screen
        .getAllByRole('button')
        .find((b) => b.querySelector('svg.h-3.w-3.lucide-trash-2'))!

      await user.click(deleteModelButton)
      await user.click(screen.getByText('取消'))

      expect(storeMocks.deleteModel).not.toHaveBeenCalled()
    })

    it('保存模型后关闭表单', async () => {
      const user = await openModelList()
      const addModelButton = screen.getByText('添加模型')

      await user.click(addModelButton)
      await user.click(screen.getByText('Save Model'))

      await waitFor(() =>
        expect(storeMocks.saveModel).toHaveBeenCalledWith('openai', {
          id: 'model-new',
          name: 'New',
          providerId: 'openai',
        }),
      )
    })
  })

  describe('供应商编辑与掩码 key', () => {
    it('编辑供应商时读取掩码 key 并传给表单', async () => {
      const getMaskedKey = vi.fn().mockResolvedValue('sk-1***abcd')
      Object.defineProperty(window, 'api', {
        value: { settings: { getMaskedKey } },
        writable: true,
      })
      renderPanel()
      const user = userEvent.setup()

      const editButton = screen
        .getAllByRole('button')
        .find((b) => b.querySelector('.lucide-pencil'))!
      await user.click(editButton)

      await waitFor(() => expect(getMaskedKey).toHaveBeenCalledWith('openai'))
      expect(screen.getByTestId('provider-form')).toHaveAttribute('data-masked', 'sk-1***abcd')
    })

    it('读取掩码 key 失败时仍打开编辑表单', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      Object.defineProperty(window, 'api', {
        value: { settings: { getMaskedKey: vi.fn().mockRejectedValue(new Error('ipc down')) } },
        writable: true,
      })
      renderPanel()
      const user = userEvent.setup()

      const editButton = screen
        .getAllByRole('button')
        .find((b) => b.querySelector('.lucide-pencil'))!
      await user.click(editButton)

      await waitFor(() => expect(screen.getByTestId('provider-form')).toBeInTheDocument())
      expect(consoleError).toHaveBeenCalled()
      consoleError.mockRestore()
    })

    it('保存供应商后自动拉取模型', async () => {
      storeMocks.fetchModels.mockResolvedValue({
        models: [{ id: 'gpt-4o', name: 'gpt-4o', providerId: 'new-provider' }],
      })
      renderPanel()
      const user = userEvent.setup()

      await user.click(screen.getByText('添加供应商'))
      await user.click(screen.getByText('Save Provider'))

      await waitFor(() => expect(storeMocks.saveProvider).toHaveBeenCalled())
      await waitFor(() => expect(storeMocks.fetchModels).toHaveBeenCalledWith('new-provider'))
      await waitFor(() => expect(storeMocks.saveModel).toHaveBeenCalled())
    })
  })
})
