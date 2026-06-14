import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ApiKeyForm } from '../ApiKeyForm'
import '../../../i18n'

vi.mock('../../ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid='alert-dialog'>{children}</div> : null,
  AlertDialogAction: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) =>
    <button onClick={onClick}>{children}</button>,
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}))

vi.mock('../../../stores/settings-store', () => ({
  useSettingsStore: vi.fn(),
}))

const { useSettingsStore } = await import('../../../stores/settings-store')
const mockUseSettingsStore = vi.mocked(useSettingsStore)

// 模拟 window.api.settings.getMaskedKey
const mockGetMaskedKey = vi.fn().mockResolvedValue(null)

beforeEach(() => {
  vi.clearAllMocks()
  mockGetMaskedKey.mockResolvedValue(null)
  
  // 设置 window.api 模拟
  Object.defineProperty(window, 'api', {
    value: {
      settings: {
        getMaskedKey: mockGetMaskedKey,
      },
    },
    writable: true,
  })

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
    mockGetMaskedKey.mockResolvedValue('sk-s***key')
    mockUseSettingsStore.mockReturnValue({
      loadApiKey: vi.fn().mockResolvedValue('saved-key'),
      saveApiKey: vi.fn(),
      deleteApiKey: vi.fn(),
    } as unknown as ReturnType<typeof useSettingsStore>)

    render(<ApiKeyForm />)
    await waitFor(() => {
      expect(screen.getAllByText('sk-s***key')).toHaveLength(2)
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
    mockGetMaskedKey.mockResolvedValue('sk-s***key')
    const deleteApiKey = vi.fn().mockResolvedValue(undefined)
    mockUseSettingsStore.mockReturnValue({
      loadApiKey: vi.fn().mockResolvedValue('saved-key'),
      saveApiKey: vi.fn(),
      deleteApiKey,
    } as unknown as ReturnType<typeof useSettingsStore>)

    render(<ApiKeyForm />)
    await waitFor(() => {
      expect(screen.getAllByText('sk-s***key')).toHaveLength(2)
    })
    fireEvent.click(screen.getAllByText('删除')[0])

    await waitFor(() => {
      expect(screen.getByText('确定删除此 API Key？')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('确定'))

    await waitFor(() => {
      expect(deleteApiKey).toHaveBeenCalledWith('openai')
    })
  })

  it('shows saving state during save', async () => {
    let resolveSave: () => void
    mockUseSettingsStore.mockReturnValue({
      loadApiKey: vi.fn().mockResolvedValue(null),
      saveApiKey: vi.fn().mockReturnValue(
        new Promise<void>((r) => {
          resolveSave = r
        }),
      ),
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
