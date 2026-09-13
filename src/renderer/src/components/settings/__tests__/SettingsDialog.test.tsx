import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { SettingsDialog } from '../SettingsDialog'
import '../../../i18n'

vi.stubGlobal(
  'getComputedStyle',
  vi.fn(() => ({
    getPropertyValue: () => '',
    paddingLeft: '0px',
    paddingRight: '0px',
  })),
)

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
  ApiKeyForm: () => <div data-testid='api-key-form'>ApiKeyForm</div>,
}))

vi.mock('../ModelConfigPanel', () => ({
  ModelConfigPanel: () => <div data-testid='model-config-panel'>ModelConfigPanel</div>,
}))

vi.mock('../UpdateDialog', () => ({
  UpdateDialog: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid='update-dialog'>UpdateDialog</div> : null,
}))

vi.mock('../PermissionPanel', () => ({
  PermissionPanel: () => <div data-testid='permission-panel'>PermissionPanel</div>,
}))

vi.mock('../../audit/AuditLogPanel', () => ({
  AuditLogPanel: () => <div data-testid='audit-log-panel'>AuditLogPanel</div>,
}))

vi.mock('../../memory/MemoryPanel', () => ({
  MemoryPanel: () => <div data-testid='memory-panel'>MemoryPanel</div>,
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
    setThemeMode: vi.fn(),
    setTheme: vi.fn(),
  } as unknown as ReturnType<typeof useThemeStore>)

  mockUseUpdateStore.mockReturnValue({
    status: 'idle',
    checkForUpdates: vi.fn(),
  } as unknown as ReturnType<typeof useUpdateStore>)

  ;(window as any).api = { theme: {}, system: { getFonts: vi.fn().mockResolvedValue([]) } }
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

  it('switches to permission, audit and memory tabs', () => {
    render(<SettingsDialog isOpen={true} onClose={vi.fn()} />)

    fireEvent.click(screen.getByText('权限'))
    expect(screen.getByTestId('permission-panel')).toBeInTheDocument()

    fireEvent.click(screen.getByText('日志'))
    expect(screen.getByTestId('audit-log-panel')).toBeInTheDocument()

    fireEvent.click(screen.getByText('记忆'))
    expect(screen.getByTestId('memory-panel')).toBeInTheDocument()
  })

  it('切换语言时调用 setLanguage', () => {
    const setLanguage = vi.fn()
    mockUseAgentStore.mockReturnValue({
      language: 'zh',
      setLanguage,
    } as unknown as ReturnType<typeof useAgentStore>)

    render(<SettingsDialog isOpen={true} onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('语言'))
    fireEvent.click(screen.getByText('English'))

    expect(setLanguage).toHaveBeenCalledWith('en')
  })

  it('中英文按钮按当前语言高亮', () => {
    mockUseAgentStore.mockReturnValue({
      language: 'en',
      setLanguage: vi.fn(),
    } as unknown as ReturnType<typeof useAgentStore>)

    render(<SettingsDialog isOpen={true} onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('语言'))

    expect(screen.getByText('English').className).toContain('bg-primary')
  })

  it('主题页勾选跟随系统时切换到 system 模式', () => {
    const setThemeMode = vi.fn()
    mockUseThemeStore.mockReturnValue({
      mode: 'dark',
      currentThemeId: 'dark',
      setThemeMode,
      setTheme: vi.fn(),
    } as unknown as ReturnType<typeof useThemeStore>)

    render(<SettingsDialog isOpen={true} onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('主题'))
    fireEvent.click(screen.getByRole('checkbox'))

    expect(setThemeMode).toHaveBeenCalledWith('system')
  })

  it('选择具体主题时调用 setTheme', () => {
    const setTheme = vi.fn()
    mockUseThemeStore.mockReturnValue({
      mode: 'dark',
      currentThemeId: 'dark',
      setThemeMode: vi.fn(),
      setTheme,
    } as unknown as ReturnType<typeof useThemeStore>)

    render(<SettingsDialog isOpen={true} onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('主题'))
    fireEvent.click(screen.getByText('Light'))

    expect(setTheme).toHaveBeenCalledWith('light')
  })

  it('system 模式下主题按钮禁用', () => {
    mockUseThemeStore.mockReturnValue({
      mode: 'system',
      currentThemeId: 'dark',
      setThemeMode: vi.fn(),
      setTheme: vi.fn(),
    } as unknown as ReturnType<typeof useThemeStore>)

    render(<SettingsDialog isOpen={true} onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('主题'))

    expect(screen.getByText('Dark').closest('button')).toBeDisabled()
    expect(screen.getByText('Light').closest('button')).toBeDisabled()
  })

  it('点击检查更新会触发检查并打开更新弹窗事件', async () => {
    const checkForUpdates = vi.fn().mockResolvedValue(undefined)
    mockUseUpdateStore.mockReturnValue({
      status: 'idle',
      checkForUpdates,
    } as unknown as ReturnType<typeof useUpdateStore>)
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    render(<SettingsDialog isOpen={true} onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('检查更新'))
    await vi.waitFor(() => expect(checkForUpdates).toHaveBeenCalled())

    const event = dispatchSpy.mock.calls
      .map((call) => call[0])
      .find((e) => (e as CustomEvent).type === 'open-update-dialog')
    expect(event).toBeDefined()

    dispatchSpy.mockRestore()
  })

  it('检查更新中禁用按钮', () => {
    mockUseUpdateStore.mockReturnValue({
      status: 'checking',
      checkForUpdates: vi.fn(),
    } as unknown as ReturnType<typeof useUpdateStore>)

    render(<SettingsDialog isOpen={true} onClose={vi.fn()} />)

    expect(screen.getByText('检查更新')).toBeDisabled()
  })

  it('监听 open-settings 事件并切换到指定标签', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    render(<SettingsDialog isOpen={true} onClose={vi.fn()} />)

    const registered = addSpy.mock.calls.find((call) => call[0] === 'open-settings')
    expect(registered).toBeDefined()
    const handler = registered![1] as EventListener

    act(() => {
      handler(new CustomEvent('open-settings', { detail: { tab: 'theme' } }))
    })

    expect(screen.getByText('Dark')).toBeInTheDocument()
    addSpy.mockRestore()
  })

  it('open-settings 事件未携带 tab 时保持当前标签', () => {
    render(<SettingsDialog isOpen={true} onClose={vi.fn()} />)

    window.dispatchEvent(new CustomEvent('open-settings', { detail: {} }))

    expect(screen.getByTestId('api-key-form')).toBeInTheDocument()
  })

  it('卸载时移除 open-settings 监听', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(<SettingsDialog isOpen={true} onClose={vi.fn()} />)

    unmount()

    expect(removeSpy.mock.calls.some((call) => call[0] === 'open-settings')).toBe(true)
    removeSpy.mockRestore()
  })
})
