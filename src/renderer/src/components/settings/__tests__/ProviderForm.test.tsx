import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProviderForm } from '../ProviderForm'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'settings.providerId': '供应商 ID',
        'settings.providerName': '供应商名称',
        'settings.apiFormat': 'API 格式',
        'settings.baseUrl': '接口地址',
        'settings.apiKey': 'API 密钥',
        'settings.invalidUrl': '请输入有效的 URL',
        'settings.apiKeyWarning': 'API Key 格式与预期模式不匹配',
        'common.cancel': '取消',
        'common.save': '保存',
      }
      return translations[key] || key
    },
  }),
}))

describe('ProviderForm', () => {
  const mockOnSave = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render form fields', () => {
    render(<ProviderForm onSave={mockOnSave} onCancel={mockOnCancel} />)

    expect(screen.getByLabelText('供应商 ID')).toBeInTheDocument()
    expect(screen.getByLabelText('供应商名称')).toBeInTheDocument()
    expect(screen.getByLabelText('API 格式')).toBeInTheDocument()
    expect(screen.getByLabelText('接口地址')).toBeInTheDocument()
    expect(screen.getByLabelText('API 密钥')).toBeInTheDocument()
  })

  it('should show URL error for invalid URL', () => {
    render(<ProviderForm onSave={mockOnSave} onCancel={mockOnCancel} />)

    const urlInput = screen.getByLabelText('接口地址')
    fireEvent.change(urlInput, { target: { value: 'not-a-url' } })

    expect(screen.getByText('请输入有效的 URL')).toBeInTheDocument()
  })

  it('should accept valid URL', () => {
    render(<ProviderForm onSave={mockOnSave} onCancel={mockOnCancel} />)

    const urlInput = screen.getByLabelText('接口地址')
    fireEvent.change(urlInput, { target: { value: 'https://api.openai.com/v1' } })

    expect(screen.queryByText('请输入有效的 URL')).not.toBeInTheDocument()
  })

  it('should show API key warning for invalid OpenAI key', () => {
    render(<ProviderForm onSave={mockOnSave} onCancel={mockOnCancel} />)

    const apiKeyInput = screen.getByLabelText('API 密钥')
    fireEvent.change(apiKeyInput, { target: { value: 'invalid-key' } })

    expect(screen.getByText('API Key 格式与预期模式不匹配')).toBeInTheDocument()
  })

  it('should clear warning for valid OpenAI API key', () => {
    render(<ProviderForm onSave={mockOnSave} onCancel={mockOnCancel} />)

    const apiKeyInput = screen.getByLabelText('API 密钥')
    fireEvent.change(apiKeyInput, { target: { value: 'sk-test123' } })

    expect(screen.queryByText('API Key 格式与预期模式不匹配')).not.toBeInTheDocument()
  })

  it('should clear warning for valid Anthropic API key', () => {
    render(<ProviderForm onSave={mockOnSave} onCancel={mockOnCancel} />)

    const formatSelect = screen.getByLabelText('API 格式')
    fireEvent.change(formatSelect, { target: { value: 'anthropic' } })

    const apiKeyInput = screen.getByLabelText('API 密钥')
    fireEvent.change(apiKeyInput, { target: { value: 'sk-ant-test123' } })

    expect(screen.queryByText('API Key 格式与预期模式不匹配')).not.toBeInTheDocument()
  })

  it('should show API key warning for invalid Anthropic key', async () => {
    render(<ProviderForm onSave={mockOnSave} onCancel={mockOnCancel} />)

    // Open the select dropdown
    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)

    // Select Anthropic option from the dropdown (not the hidden select)
    const anthropicOption = screen.getByRole('option', { name: 'Anthropic' })
    fireEvent.click(anthropicOption)

    // Enter invalid API key
    const apiKeyInput = screen.getByLabelText('API 密钥')
    fireEvent.change(apiKeyInput, { target: { value: 'sk-test123' } })

    expect(screen.getByText('API Key 格式与预期模式不匹配')).toBeInTheDocument()
  })

  it('should call onSave with form data', () => {
    render(<ProviderForm onSave={mockOnSave} onCancel={mockOnCancel} />)

    fireEvent.change(screen.getByLabelText('供应商 ID'), { target: { value: 'openai' } })
    fireEvent.change(screen.getByLabelText('供应商名称'), { target: { value: 'OpenAI' } })
    fireEvent.change(screen.getByLabelText('接口地址'), {
      target: { value: 'https://api.openai.com/v1' },
    })
    fireEvent.change(screen.getByLabelText('API 密钥'), { target: { value: 'sk-test123' } })

    fireEvent.submit(screen.getByRole('button', { name: '保存' }))

    expect(mockOnSave).toHaveBeenCalledWith({
      id: 'openai',
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-test123',
      apiFormat: 'openai',
      models: [],
    })
  })

  it('should call onSave even with invalid API key format', () => {
    render(<ProviderForm onSave={mockOnSave} onCancel={mockOnCancel} />)

    fireEvent.change(screen.getByLabelText('供应商 ID'), { target: { value: 'openai' } })
    fireEvent.change(screen.getByLabelText('供应商名称'), { target: { value: 'OpenAI' } })
    fireEvent.change(screen.getByLabelText('接口地址'), {
      target: { value: 'https://api.openai.com/v1' },
    })
    fireEvent.change(screen.getByLabelText('API 密钥'), { target: { value: 'custom-key' } })

    fireEvent.submit(screen.getByRole('button', { name: '保存' }))

    expect(mockOnSave).toHaveBeenCalledWith({
      id: 'openai',
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'custom-key',
      apiFormat: 'openai',
      models: [],
    })
  })

  it('should call onCancel when cancel button is clicked', () => {
    render(<ProviderForm onSave={mockOnSave} onCancel={mockOnCancel} />)

    fireEvent.click(screen.getByText('取消'))

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('should populate form with existing provider data', () => {
    const provider = {
      id: 'openai',
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      apiFormat: 'openai' as const,
      models: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    render(<ProviderForm provider={provider} onSave={mockOnSave} onCancel={mockOnCancel} />)

    expect(screen.getByLabelText('供应商 ID')).toHaveValue('openai')
    expect(screen.getByLabelText('供应商名称')).toHaveValue('OpenAI')
    expect(screen.getByLabelText('接口地址')).toHaveValue('https://api.openai.com/v1')
  })
})
