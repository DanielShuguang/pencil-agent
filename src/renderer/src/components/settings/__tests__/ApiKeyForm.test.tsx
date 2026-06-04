import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ApiKeyForm } from '../ApiKeyForm'
import '../../../i18n'

vi.mock('../../../stores/settings-store', () => ({
  useSettingsStore: vi.fn(),
}))

const { useSettingsStore } = await import('../../../stores/settings-store')
const mockUseSettingsStore = vi.mocked(useSettingsStore)

beforeEach(() => {
  mockUseSettingsStore.mockReturnValue({
    loadApiKey: vi.fn().mockResolvedValue(null),
    saveApiKey: vi.fn().mockResolvedValue(undefined),
    deleteApiKey: vi.fn().mockResolvedValue(undefined),
  } as unknown as ReturnType<typeof useSettingsStore>)
})

describe('ApiKeyForm', () => {
  it('renders provider labels', () => {
    render(<ApiKeyForm />)
    expect(screen.getByText('OpenAI')).toBeInTheDocument()
    expect(screen.getByText('Anthropic')).toBeInTheDocument()
  })

  it('renders input fields for providers without saved keys', () => {
    render(<ApiKeyForm />)
    expect(screen.getByPlaceholderText('sk-...')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('sk-ant-...')).toBeInTheDocument()
  })

  it('shows saved state when key exists', async () => {
    mockUseSettingsStore.mockReturnValue({
      loadApiKey: vi.fn().mockResolvedValue('saved-key'),
      saveApiKey: vi.fn(),
      deleteApiKey: vi.fn(),
    } as unknown as ReturnType<typeof useSettingsStore>)

    render(<ApiKeyForm />)
    await waitFor(() => {
      expect(screen.getAllByText('已保存')).toHaveLength(2)
    })
  })

  it('calls saveApiKey on save click', async () => {
    const saveApiKey = vi.fn().mockResolvedValue(undefined)
    mockUseSettingsStore.mockReturnValue({
      loadApiKey: vi.fn().mockResolvedValue(null),
      saveApiKey,
      deleteApiKey: vi.fn(),
    } as unknown as ReturnType<typeof useSettingsStore>)

    render(<ApiKeyForm />)
    const inputs = screen.getAllByPlaceholderText('sk-...')
    fireEvent.change(inputs[0], { target: { value: 'test-key' } })
    fireEvent.click(screen.getAllByText('保存')[0])

    await waitFor(() => {
      expect(saveApiKey).toHaveBeenCalledWith('openai', 'test-key')
    })
  })

  it('calls deleteApiKey on delete click', async () => {
    const deleteApiKey = vi.fn().mockResolvedValue(undefined)
    mockUseSettingsStore.mockReturnValue({
      loadApiKey: vi.fn().mockResolvedValue('saved-key'),
      saveApiKey: vi.fn(),
      deleteApiKey,
    } as unknown as ReturnType<typeof useSettingsStore>)

    render(<ApiKeyForm />)
    await waitFor(() => {
      expect(screen.getAllByText('已保存')).toHaveLength(2)
    })
    fireEvent.click(screen.getAllByText('删除')[0])

    await waitFor(() => {
      expect(deleteApiKey).toHaveBeenCalledWith('openai')
    })
  })

  it('shows saving state during save', async () => {
    let resolveSave: () => void
    mockUseSettingsStore.mockReturnValue({
      loadApiKey: vi.fn().mockResolvedValue(null),
      saveApiKey: vi.fn().mockReturnValue(new Promise<void>((r) => { resolveSave = r })),
      deleteApiKey: vi.fn(),
    } as unknown as ReturnType<typeof useSettingsStore>)

    render(<ApiKeyForm />)
    const inputs = screen.getAllByPlaceholderText('sk-...')
    fireEvent.change(inputs[0], { target: { value: 'test-key' } })
    fireEvent.click(screen.getAllByText('保存')[0])

    await waitFor(() => {
      expect(screen.getByText('保存中...')).toBeInTheDocument()
    })

    resolveSave!()
  })

  it('disables save button when input is empty', () => {
    render(<ApiKeyForm />)
    const saveButtons = screen.getAllByText('保存')
    expect(saveButtons[0]).toBeDisabled()
  })
})
