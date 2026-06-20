import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

vi.mock('../../../i18n', () => ({}))

vi.mock('ts-pattern', () => ({
  match: (value: any) => {
    let result: any = value
    let matched = false
    const chain: any = {
      with: (_pattern: any, handler: any) => {
        if (!matched) {
          const isMatch = typeof _pattern === 'function' ? _pattern(value) : _pattern === value
          if (isMatch) {
            result = handler(value)
            matched = true
          }
        }
        return chain
      },
      when: (_predicate: any, handler: any) => {
        if (!matched && _predicate(value)) {
          result = handler(value)
          matched = true
        }
        return chain
      },
      otherwise: (handler: any) => {
        if (!matched) {
          result = handler(value)
        }
        return result
      },
      exhaustive: () => result,
    }
    return chain
  },
}))

vi.mock('../../sidebar/Sidebar', () => ({
  Sidebar: () => React.createElement('div', { 'data-testid': 'sidebar' }),
}))

vi.mock('../../settings/SettingsDialog', () => ({
  SettingsDialog: () => React.createElement('div', { 'data-testid': 'settings-dialog' }),
}))

vi.mock('../StatusBar', () => ({
  StatusBar: () => React.createElement('div', { 'data-testid': 'status-bar' }),
}))

vi.mock('../../permission/PermissionConfirmDialog', () => ({
  PermissionConfirmDialog: () => React.createElement('div', { 'data-testid': 'permission-dialog' }),
}))

vi.mock('../../ui/loading', () => ({
  Loading: () => React.createElement('div', { 'data-testid': 'loading' }),
}))

vi.mock('../../ui/resize-handle', () => ({
  ResizeHandle: () => React.createElement('div', { 'data-testid': 'resize-handle' }),
}))

vi.mock('../../ui/error-boundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('../../../stores/workflow-store', () => ({
  useWorkflowStore: Object.assign(vi.fn(), { getState: vi.fn() }),
}))

vi.mock('../../../stores/permission-store', () => ({
  usePermissionStore: Object.assign(vi.fn(), { getState: vi.fn() }),
}))

vi.mock('../../../stores/update-store', () => ({
  useUpdateStore: Object.assign(vi.fn(), { getState: vi.fn() }),
}))

vi.mock('../../../hooks/useGlobalShortcuts', () => ({
  useGlobalShortcuts: vi.fn(),
}))

vi.mock('../../../hooks/useNewSession', () => ({
  useNewSession: () => vi.fn(),
}))

vi.mock('../../../code-editor/EditorPanel', () => ({
  EditorPanel: () => React.createElement('div', { 'data-testid': 'editor-panel' }),
}))

vi.mock('../../../code-editor/FileTree', () => ({
  FileTree: () => React.createElement('div', { 'data-testid': 'file-tree' }),
}))

vi.mock('../../../code-editor/TabBar', () => ({
  TabBar: () => React.createElement('div', { 'data-testid': 'tab-bar' }),
}))

vi.mock('../../../code-editor/TerminalPanel', () => ({
  TerminalPanel: () => React.createElement('div', { 'data-testid': 'terminal-panel' }),
}))

vi.mock('../../../workflow/WorkflowCanvas', () => ({
  WorkflowCanvas: () => React.createElement('div', { 'data-testid': 'workflow-canvas' }),
}))

vi.mock('../../../workflow/WorkflowToolbar', () => ({
  WorkflowToolbar: () => React.createElement('div', { 'data-testid': 'workflow-toolbar' }),
}))

vi.mock('../../../workflow/panels/NodeConfigPanel', () => ({
  NodeConfigPanel: () => React.createElement('div', { 'data-testid': 'node-config-panel' }),
}))

const mockWindowApi = {
  window: {
    isMaximized: vi.fn().mockResolvedValue(false),
    onMaximizedChanged: vi.fn(() => vi.fn()),
    minimize: vi.fn(),
    maximize: vi.fn(),
    close: vi.fn(),
  },
  permission: {
    onConfirmRequest: vi.fn(() => vi.fn()),
  },
  workflow: {
    onProgress: vi.fn(() => vi.fn()),
    execute: vi.fn().mockResolvedValue(undefined),
  },
}
;(window as any).api = { ...(window as any).api, ...mockWindowApi }

const { useWorkflowStore } = await import('../../../stores/workflow-store')
const { usePermissionStore } = await import('../../../stores/permission-store')
const { useUpdateStore } = await import('../../../stores/update-store')

beforeEach(() => {
  vi.clearAllMocks()

  vi.mocked(useWorkflowStore).mockReturnValue({
    selectedNodeId: null,
    setExecuting: vi.fn(),
    updateNodeStatus: vi.fn(),
    nodes: [],
    edges: [],
  } as any)
  vi.mocked(useWorkflowStore).getState.mockReturnValue({ nodes: [], edges: [] })

  vi.mocked(usePermissionStore).mockReturnValue({
    config: { mode: 'auto', disabledTools: [], dangerousPatternOverrides: [] },
    pendingConfirm: null,
    isLoaded: true,
    fetchConfig: vi.fn(),
    handleConfirmRequest: vi.fn(),
  } as any)
  vi.mocked(usePermissionStore).getState.mockReturnValue({
    fetchConfig: vi.fn(),
    handleConfirmRequest: vi.fn(),
  })

  vi.mocked(useUpdateStore).mockReturnValue({
    status: 'idle',
    progress: 0,
    error: null,
    updateInfo: null,
    initListeners: vi.fn(() => vi.fn()),
  } as any)
  vi.mocked(useUpdateStore).getState.mockReturnValue({
    initListeners: vi.fn(() => vi.fn()),
  })
})

const { AppShell } = await import('../AppShell')

describe('AppShell', () => {
  it('renders title Pencil Agent', () => {
    render(<AppShell><div>child</div></AppShell>)
    expect(screen.getByText('Pencil Agent')).toBeInTheDocument()
  })

  it('renders children', () => {
    render(<AppShell><div>test-child</div></AppShell>)
    expect(screen.getByText('test-child')).toBeInTheDocument()
  })

  it('renders tab buttons', () => {
    render(<AppShell><div>child</div></AppShell>)
    expect(screen.getByText('app.chat')).toBeInTheDocument()
    expect(screen.getByText('app.editor')).toBeInTheDocument()
    expect(screen.getByText('app.workflow')).toBeInTheDocument()
  })

  it('renders status bar', () => {
    render(<AppShell><div>child</div></AppShell>)
    expect(screen.getByTestId('status-bar')).toBeInTheDocument()
  })

  it('switches active tab on click', () => {
    render(<AppShell><div>child</div></AppShell>)
    const editorTab = screen.getByText('app.editor')
    fireEvent.click(editorTab)
    expect(editorTab.closest('button')).toHaveClass('bg-primary')
  })

  it('renders settings button', () => {
    render(<AppShell><div>child</div></AppShell>)
    const settingsButton = screen.getByTestId('settings-dialog').closest('div')
    expect(settingsButton).toBeInTheDocument()
  })
})
