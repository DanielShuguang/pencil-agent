import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PermissionPanel } from '../PermissionPanel'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

const mockFetchConfig = vi.fn()
const mockUpdateConfig = vi.fn()

vi.mock('../../../stores/permission-store', () => ({
  usePermissionStore: vi.fn(),
}))

const { usePermissionStore } = await import('../../../stores/permission-store')
const mockUsePermissionStore = vi.mocked(usePermissionStore)

beforeEach(() => {
  vi.clearAllMocks()
  mockUsePermissionStore.mockReturnValue({
    config: { mode: 'smart', disabledTools: [], dangerousPatternOverrides: [] },
    isLoaded: true,
    fetchConfig: mockFetchConfig,
    updateConfig: mockUpdateConfig,
  } as unknown as ReturnType<typeof usePermissionStore>)
})

describe('PermissionPanel', () => {
  it('显示加载状态', () => {
    mockUsePermissionStore.mockReturnValue({
      config: { mode: 'smart', disabledTools: [], dangerousPatternOverrides: [] },
      isLoaded: false,
      fetchConfig: mockFetchConfig,
      updateConfig: mockUpdateConfig,
    } as unknown as ReturnType<typeof usePermissionStore>)

    render(<PermissionPanel />)
    expect(screen.getByText('common.loading')).toBeInTheDocument()
  })

  it('未加载时调用 fetchConfig', () => {
    mockUsePermissionStore.mockReturnValue({
      config: { mode: 'smart', disabledTools: [], dangerousPatternOverrides: [] },
      isLoaded: false,
      fetchConfig: mockFetchConfig,
      updateConfig: mockUpdateConfig,
    } as unknown as ReturnType<typeof usePermissionStore>)

    render(<PermissionPanel />)
    expect(mockFetchConfig).toHaveBeenCalled()
  })

  it('渲染三种模式按钮', () => {
    render(<PermissionPanel />)
    expect(screen.getByText('permission.modeAuto')).toBeInTheDocument()
    expect(screen.getByText('permission.modePrompt')).toBeInTheDocument()
    expect(screen.getByText('permission.modeSmart')).toBeInTheDocument()
  })

  it('当前模式按钮高亮', () => {
    mockUsePermissionStore.mockReturnValue({
      config: { mode: 'prompt', disabledTools: [], dangerousPatternOverrides: [] },
      isLoaded: true,
      fetchConfig: mockFetchConfig,
      updateConfig: mockUpdateConfig,
    } as unknown as ReturnType<typeof usePermissionStore>)

    const { container } = render(<PermissionPanel />)
    const buttons = container.querySelectorAll('button')
    const promptButton = Array.from(buttons).find((b) => b.textContent?.includes('permission.modePrompt'))
    expect(promptButton?.className).toContain('bg-primary')
  })

  it('点击模式按钮调用 updateConfig', () => {
    render(<PermissionPanel />)
    fireEvent.click(screen.getByText('permission.modeAuto'))
    expect(mockUpdateConfig).toHaveBeenCalledWith({ mode: 'auto' })
  })

  it('渲染工具列表', () => {
    render(<PermissionPanel />)
    expect(screen.getByText('read')).toBeInTheDocument()
    expect(screen.getByText('write')).toBeInTheDocument()
    expect(screen.getByText('bash')).toBeInTheDocument()
  })

  it('禁用工具显示启用按钮', () => {
    mockUsePermissionStore.mockReturnValue({
      config: { mode: 'smart', disabledTools: ['bash'], dangerousPatternOverrides: [] },
      isLoaded: true,
      fetchConfig: mockFetchConfig,
      updateConfig: mockUpdateConfig,
    } as unknown as ReturnType<typeof usePermissionStore>)

    render(<PermissionPanel />)
    expect(screen.getByText('permission.enable')).toBeInTheDocument()
  })

  it('点击切换工具启用/禁用', () => {
    mockUsePermissionStore.mockReturnValue({
      config: { mode: 'smart', disabledTools: ['bash'], dangerousPatternOverrides: [] },
      isLoaded: true,
      fetchConfig: mockFetchConfig,
      updateConfig: mockUpdateConfig,
    } as unknown as ReturnType<typeof usePermissionStore>)

    render(<PermissionPanel />)
    fireEvent.click(screen.getByText('permission.enable'))
    expect(mockUpdateConfig).toHaveBeenCalledWith({
      disabledTools: [],
    })
  })
})
