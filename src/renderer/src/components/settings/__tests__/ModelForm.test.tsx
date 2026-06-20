import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ModelForm } from '../ModelForm'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

const mockOnSave = vi.fn()
const mockOnCancel = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ModelForm', () => {
  it('渲染所有表单字段', () => {
    render(<ModelForm providerId='openai' onSave={mockOnSave} onCancel={mockOnCancel} />)
    expect(screen.getByLabelText('settings.modelId')).toBeInTheDocument()
    expect(screen.getByLabelText('settings.modelName')).toBeInTheDocument()
    expect(screen.getByLabelText('settings.maxTokens')).toBeInTheDocument()
    expect(screen.getByLabelText('settings.temperature')).toBeInTheDocument()
  })

  it('预填充已有模型数据', () => {
    render(
      <ModelForm
        model={{ id: 'gpt-4o', name: 'GPT-4o', providerId: 'openai', maxTokens: 4096, temperature: 0.7 }}
        providerId='openai'
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />,
    )
    expect(screen.getByLabelText('settings.modelId')).toHaveValue('gpt-4o')
    expect(screen.getByLabelText('settings.modelName')).toHaveValue('GPT-4o')
    expect(screen.getByLabelText('settings.maxTokens')).toHaveValue(4096)
    expect(screen.getByLabelText('settings.temperature')).toHaveValue(0.7)
  })

  it('验证 maxTokens 范围 (1-1000000)', () => {
    render(<ModelForm providerId='openai' onSave={mockOnSave} onCancel={mockOnCancel} />)
    const maxTokensInput = screen.getByLabelText('settings.maxTokens')

    fireEvent.change(maxTokensInput, { target: { value: '0' } })
    expect(screen.getByText('settings.maxTokensRange')).toBeInTheDocument()

    fireEvent.change(maxTokensInput, { target: { value: '2000000' } })
    expect(screen.getByText('settings.maxTokensRange')).toBeInTheDocument()

    fireEvent.change(maxTokensInput, { target: { value: '4096' } })
    expect(screen.queryByText('settings.maxTokensRange')).not.toBeInTheDocument()
  })

  it('验证 temperature 范围 (0-2)', () => {
    render(<ModelForm providerId='openai' onSave={mockOnSave} onCancel={mockOnCancel} />)
    const temperatureInput = screen.getByLabelText('settings.temperature')

    fireEvent.change(temperatureInput, { target: { value: '-1' } })
    expect(screen.getByText('settings.temperatureRange')).toBeInTheDocument()

    fireEvent.change(temperatureInput, { target: { value: '3' } })
    expect(screen.getByText('settings.temperatureRange')).toBeInTheDocument()

    fireEvent.change(temperatureInput, { target: { value: '1.5' } })
    expect(screen.queryByText('settings.temperatureRange')).not.toBeInTheDocument()
  })

  it('提交调用 onSave', () => {
    const { container } = render(<ModelForm providerId='openai' onSave={mockOnSave} onCancel={mockOnCancel} />)

    fireEvent.change(screen.getByLabelText('settings.modelId'), { target: { value: 'gpt-4o' } })
    fireEvent.change(screen.getByLabelText('settings.modelName'), { target: { value: 'GPT-4o' } })
    fireEvent.change(screen.getByLabelText('settings.maxTokens'), { target: { value: '4096' } })
    fireEvent.change(screen.getByLabelText('settings.temperature'), { target: { value: '0.7' } })

    fireEvent.submit(container.querySelector('form')!)

    expect(mockOnSave).toHaveBeenCalledWith({
      id: 'gpt-4o',
      name: 'GPT-4o',
      providerId: 'openai',
      maxTokens: 4096,
      temperature: 0.7,
    })
  })

  it('无效 maxTokens 阻止提交', () => {
    const { container } = render(<ModelForm providerId='openai' onSave={mockOnSave} onCancel={mockOnCancel} />)

    fireEvent.change(screen.getByLabelText('settings.modelId'), { target: { value: 'gpt-4o' } })
    fireEvent.change(screen.getByLabelText('settings.modelName'), { target: { value: 'GPT-4o' } })
    fireEvent.change(screen.getByLabelText('settings.maxTokens'), { target: { value: '0' } })

    fireEvent.submit(container.querySelector('form')!)

    expect(mockOnSave).not.toHaveBeenCalled()
  })

  it('无效 temperature 阻止提交', () => {
    const { container } = render(<ModelForm providerId='openai' onSave={mockOnSave} onCancel={mockOnCancel} />)

    fireEvent.change(screen.getByLabelText('settings.modelId'), { target: { value: 'gpt-4o' } })
    fireEvent.change(screen.getByLabelText('settings.modelName'), { target: { value: 'GPT-4o' } })
    fireEvent.change(screen.getByLabelText('settings.temperature'), { target: { value: '3' } })

    fireEvent.submit(container.querySelector('form')!)

    expect(mockOnSave).not.toHaveBeenCalled()
  })

  it('取消按钮调用 onCancel', () => {
    render(<ModelForm providerId='openai' onSave={mockOnSave} onCancel={mockOnCancel} />)
    fireEvent.click(screen.getByText('common.cancel'))
    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('空 maxTokens/temperature 时提交为 undefined', () => {
    const { container } = render(<ModelForm providerId='openai' onSave={mockOnSave} onCancel={mockOnCancel} />)

    fireEvent.change(screen.getByLabelText('settings.modelId'), { target: { value: 'gpt-4o' } })
    fireEvent.change(screen.getByLabelText('settings.modelName'), { target: { value: 'GPT-4o' } })

    fireEvent.submit(container.querySelector('form')!)

    expect(mockOnSave).toHaveBeenCalledWith({
      id: 'gpt-4o',
      name: 'GPT-4o',
      providerId: 'openai',
      maxTokens: undefined,
      temperature: undefined,
    })
  })
})
