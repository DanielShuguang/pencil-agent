import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

const mocks = vi.hoisted(() => ({
  agentInitFromStorage: vi.fn(),
  syncModelWithProviders: vi.fn(),
  statusInit: vi.fn(),
  themeInitFromStorage: vi.fn(),
  applyFromMain: vi.fn(),
  applyTheme: vi.fn(),
  themeUnsubscribe: vi.fn(),
  onThemeChanged: vi.fn(),
  handleNewSession: vi.fn(),
  currentTheme: { id: 'dark' },
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

vi.mock('../i18n', () => ({}))

vi.mock('../components/layout/AppShell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='app-shell'>{children}</div>
  ),
}))

vi.mock('../components/chat/ChatPanel', () => ({
  ChatPanel: () => <div data-testid='chat-panel' />,
}))

vi.mock('../components/ui/button', () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}))

vi.mock('../components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('../stores/agent-store', () => ({
  useAgentStore: () => ({
    activeSessionId: null,
    initFromStorage: mocks.agentInitFromStorage,
    syncModelWithProviders: mocks.syncModelWithProviders,
  }),
}))

vi.mock('../stores/status-store', () => ({
  useStatusStore: () => ({ init: mocks.statusInit }),
}))

vi.mock('../stores/theme-store', () => ({
  useThemeStore: Object.assign(
    () => ({
      initFromStorage: mocks.themeInitFromStorage,
      currentTheme: mocks.currentTheme,
    }),
    { getState: () => ({ applyFromMain: mocks.applyFromMain }) },
  ),
}))

vi.mock('../themes/apply-theme', () => ({
  applyTheme: mocks.applyTheme,
}))

vi.mock('../hooks/useNewSession', () => ({
  useNewSession: () => mocks.handleNewSession,
}))

import App from '../App'

describe('App 启动初始化', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    document.documentElement.style.removeProperty('--font-family')
    mocks.onThemeChanged.mockReturnValue(mocks.themeUnsubscribe)
    ;(window as any).api = {
      theme: { onThemeChanged: mocks.onThemeChanged },
    }
  })

  it('挂载时初始化会话、状态、主题与模型', () => {
    render(<App />)

    expect(mocks.agentInitFromStorage).toHaveBeenCalledTimes(1)
    expect(mocks.statusInit).toHaveBeenCalledTimes(1)
    expect(mocks.themeInitFromStorage).toHaveBeenCalledTimes(1)
    expect(mocks.syncModelWithProviders).toHaveBeenCalledTimes(1)
  })

  it('应用当前主题', () => {
    render(<App />)

    expect(mocks.applyTheme).toHaveBeenCalledWith(mocks.currentTheme)
  })

  it('从 localStorage 恢复字体设置', () => {
    localStorage.setItem('pencil-agent:font-family', "'Maple Mono NF CN', monospace")

    render(<App />)

    expect(document.documentElement.style.getPropertyValue('--font-family')).toBe(
      "'Maple Mono NF CN', monospace",
    )
  })

  it('没有保存字体时不设置 CSS 变量', () => {
    render(<App />)

    expect(document.documentElement.style.getPropertyValue('--font-family')).toBe('')
  })

  it('订阅主进程主题变化并在卸载时清理', () => {
    const { unmount } = render(<App />)

    expect(mocks.onThemeChanged).toHaveBeenCalledTimes(1)

    const callback = mocks.onThemeChanged.mock.calls[0][0] as (state: unknown) => void
    callback({ mode: 'light' })
    expect(mocks.applyFromMain).toHaveBeenCalledWith({ mode: 'light' })

    unmount()
    expect(mocks.themeUnsubscribe).toHaveBeenCalledTimes(1)
  })

  it('注册全局错误与未处理 rejection 监听并阻止默认行为', () => {
    const { unmount } = render(<App />)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    // ErrorEvent 必须是 cancelable 才能观察到 preventDefault 效果
    const errorEvent = new ErrorEvent('error', {
      error: new Error('boom'),
      cancelable: true,
    })
    window.dispatchEvent(errorEvent)
    expect(errorEvent.defaultPrevented).toBe(true)

    const rejectionEvent = new Event('unhandledrejection') as PromiseRejectionEvent
    Object.defineProperty(rejectionEvent, 'reason', { value: new Error('nope') })
    expect(() => window.dispatchEvent(rejectionEvent)).not.toThrow()

    consoleError.mockRestore()

    unmount()
    expect(window.onerror).toBeNull()
  })

  it('没有会话时展示空状态并允许新建会话', () => {
    render(<App />)

    expect(screen.getByText('Pencil Agent')).toBeInTheDocument()
    screen.getByRole('button').click()

    expect(mocks.handleNewSession).toHaveBeenCalled()
  })
})
