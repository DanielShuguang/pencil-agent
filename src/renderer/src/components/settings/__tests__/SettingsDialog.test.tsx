import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsDialog } from '../SettingsDialog'
import '../../../i18n'

vi.stubGlobal('getComputedStyle', vi.fn(() => ({
  getPropertyValue: () => '',
  paddingLeft: '0px',
  paddingRight: '0px',
})))

vi.mock('../../../stores/agent-store', () => ({
  useAgentStore: vi.fn(),
}))

vi.mock('../../../stores/theme-store', () => ({
  useThemeStore: vi.fn(),
}))

vi.mock('../../../stores/update-store', () => ({
  useUpdateStore: vi.fn(),
}))

vi.mock('../../../themes/theme-registry', () => ({
  themeRegistry: {
    getAllThemes: () => [
      { id: 'dark', name: 'Dark', colors: { primary: '210 40% 98%' } },
      { id: 'light', name: 'Light', colors: { primary: '222.2 84% 4.9%' } },
    ],
  },
}))

vi.mock('../ApiKeyForm', () => ({
  ApiKeyForm: () => <div data-testid="api-key-form">ApiKeyForm</div>,
}))

vi.mock('../ModelConfigPanel', () => ({
  ModelConfigPanel: () => <div data-testid="model-config-panel">ModelConfigPanel</div>,
}))

vi.mock('../UpdateDialog', () => ({
  UpdateDialog: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="update-dialog">UpdateDialog</div> : null,
}))

const { useAgentStore } = await import('../../../stores/agent-store')
const { useThemeStore } = await import('../../../stores/theme-store')
const { useUpdateStore } = await import('../../../stores/update-store')

const mockUseAgentStore = vi.mocked(useAgentStore)
const mockUseThemeStore = vi.mocked(useThemeStore)
const mockUseUpdateStore = vi.mocked(useUpdateStore)

beforeEach(() => {
  mockUseAgentStore.mockReturnValue({
    language: 'zh',
    setLanguage: vi.fn(),
  } as unknown as ReturnType<typeof useAgentStore>)

  mockUseThemeStore.mockReturnValue({
    mode: 'dark',
    currentThemeId: 'dark',
  } as unknown as ReturnType<typeof useThemeStore>)

  mockUseUpdateStore.mockReturnValue({
    status: 'idle',
    checkForUpdates: vi.fn(),
  } as unknown as ReturnType<typeof useUpdateStore>)

  vi.stubGlobal('window', {
    ...window,
    api: { theme: { setMode: vi.fn(), setTheme: vi.fn() } },
  })
})

describe('SettingsDialog', () => {
  it('renders when open', () => {
    render(<SettingsDialog isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText('设置')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<SettingsDialog isOpen={false} onClose={vi.fn()} />)
    expect(screen.queryByText('设置')).not.toBeInTheDocument()
  })

  it('shows all tab buttons', () => {
    render(<SettingsDialog isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText('API 密钥')).toBeInTheDocument()
    expect(screen.getByText('模型')).toBeInTheDocument()
    expect(screen.getByText('语言')).toBeInTheDocument()
    expect(screen.getByText('主题')).toBeInTheDocument()
  })

  it('shows check update button', () => {
    render(<SettingsDialog isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText('检查更新')).toBeInTheDocument()
  })

  it('shows API keys tab by default', () => {
    render(<SettingsDialog isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByTestId('api-key-form')).toBeInTheDocument()
  })

  it('switches to models tab', () => {
    render(<SettingsDialog isOpen={true} onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('模型'))
    expect(screen.getByTestId('model-config-panel')).toBeInTheDocument()
  })

  it('switches to language tab', () => {
    render(<SettingsDialog isOpen={true} onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('语言'))
    expect(screen.getByText('中文')).toBeInTheDocument()
    expect(screen.getByText('English')).toBeInTheDocument()
  })

  it('switches to theme tab', () => {
    render(<SettingsDialog isOpen={true} onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('主题'))
    expect(screen.getByText('Dark')).toBeInTheDocument()
    expect(screen.getByText('Light')).toBeInTheDocument()
  })

  it('calls onClose when dialog is closed', () => {
    const onClose = vi.fn()
    render(<SettingsDialog isOpen={true} onClose={onClose} />)
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })
})
