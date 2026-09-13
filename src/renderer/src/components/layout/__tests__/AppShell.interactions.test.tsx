import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import React from 'react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

vi.mock('../../../i18n', () => ({}))

const resizeCallbacks: Array<(delta: number) => void> = []

vi.mock('../../ui/resize-handle', () => ({
  ResizeHandle: ({ onResize }: { onResize: (delta: number) => void }) => {
    resizeCallbacks.push(onResize)
    return <div data-testid='resize-handle' />
  },
}))

vi.mock('../../sidebar/Sidebar', () => ({
  Sidebar: ({ width }: { width: number }) => (
    <div data-testid='sidebar' data-width={width}>
      Sidebar
    </div>
  ),
}))

vi.mock('../../settings/SettingsDialog', () => ({
  SettingsDialog: ({ isOpen }: { isOpen: boolean }) => (
    <div data-testid='settings-dialog' data-open={isOpen} />
  ),
}))

vi.mock('../../permission/PermissionConfirmDialog', () => ({
  PermissionConfirmDialog: () => <div data-testid='permission-dialog' />,
}))

vi.mock('../StatusBar', () => ({
  StatusBar: () => <div data-testid='status-bar' />,
}))

vi.mock('../../ui/error-boundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('../../ui/loading', () => ({
  Loading: () => <div data-testid='loading' />,
}))

vi.mock('../../../workflow/WorkflowToolbar', () => ({
  WorkflowToolbar: ({ onExecute }: { onExecute: () => void }) => (
    <button data-testid='execute-workflow' onClick={onExecute}>
      execute
    </button>
  ),
}))

vi.mock('../../../workflow/WorkflowCanvas', () => ({
  WorkflowCanvas: () => <div data-testid='workflow-canvas' />,
}))

vi.mock('../../../workflow/panels/NodeConfigPanel', () => ({
  NodeConfigPanel: ({ style }: { style?: React.CSSProperties }) => (
    <div data-testid='node-config-panel' data-width={style?.width} />
  ),
}))

vi.mock('../../../code-editor/EditorPanel', () => ({
  EditorPanel: () => <div data-testid='editor-panel' />,
}))
vi.mock('../../../code-editor/FileTree', () => ({
  FileTree: () => <div data-testid='file-tree' />,
}))
vi.mock('../../../code-editor/TabBar', () => ({
  TabBar: () => <div data-testid='tab-bar' />,
}))
vi.mock('../../../code-editor/TerminalPanel', () => ({
  TerminalPanel: () => <div data-testid='terminal-panel' />,
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

vi.mock('../../../stores/agent-store', () => ({
  useAgentStore: Object.assign(vi.fn(), { getState: vi.fn() }),
}))

vi.mock('../../../hooks/useNewSession', () => ({
  useNewSession: () => vi.fn(),
}))

const mockGlobalShortcuts = vi.fn()
vi.mock('../../../hooks/useGlobalShortcuts', () => ({
  useGlobalShortcuts: (shortcuts: unknown) => mockGlobalShortcuts(shortcuts),
}))

import { AppShell } from '../AppShell'
import { useWorkflowStore } from '../../../stores/workflow-store'
import { usePermissionStore } from '../../../stores/permission-store'
import { useUpdateStore } from '../../../stores/update-store'
import { useAgentStore } from '../../../stores/agent-store'

const mockWorkflowStore = vi.mocked(useWorkflowStore) as any
const mockPermissionStore = vi.mocked(usePermissionStore) as any
const mockUpdateStore = vi.mocked(useUpdateStore) as any
const mockAgentStore = vi.mocked(useAgentStore) as any

const mockApi = {
  window: {
    isMaximized: vi.fn().mockResolvedValue(false),
    onMaximizedChanged: vi.fn(() => vi.fn()),
    minimize: vi.fn(),
    maximize: vi.fn(),
    close: vi.fn(),
  },
  permission: {
    onConfirmRequest: vi.fn((_cb?: (request: unknown) => void): (() => void) => vi.fn()),
  },
  workflow: {
    onProgress: vi.fn((_cb?: (progress: unknown) => void): (() => void) => vi.fn()),
    execute: vi.fn().mockResolvedValue({}),
  },
}

describe('AppShell 交互', () => {
  let updateNodeStatus: ReturnType<typeof vi.fn>
  let setExecuting: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    resizeCallbacks.length = 0
    updateNodeStatus = vi.fn()
    setExecuting = vi.fn()

    mockWorkflowStore.mockReturnValue({
      selectedNodeId: null,
      nodes: [],
      edges: [],
      isExecuting: false,
      nodeStatus: new Map(),
      setExecuting,
      updateNodeStatus,
      addNode: vi.fn(),
      removeNode: vi.fn(),
      selectNode: vi.fn(),
      updateNodeData: vi.fn(),
      clearWorkflow: vi.fn(),
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
    })
    mockWorkflowStore.getState.mockReturnValue({
      nodes: [],
      edges: [],
      addNode: vi.fn(),
      clearWorkflow: vi.fn(),
    })
    mockPermissionStore.getState.mockReturnValue({
      fetchConfig: vi.fn().mockResolvedValue(undefined),
      handleConfirmRequest: vi.fn(),
    })
    mockUpdateStore.getState.mockReturnValue({ initListeners: vi.fn(() => vi.fn()) })
    mockAgentStore.getState.mockReturnValue({
      activeSessionId: 's1',
      sessionMetas: new Map([['s1', { id: 's1', cwd: '/workspace/app' }]]),
    })
    ;(window as any).api = mockApi
  })

  describe('窗口控制', () => {
    it('最小化/最大化/关闭按钮调用对应 API', () => {
      render(<AppShell>content</AppShell>)

      const buttons = screen.getAllByRole('button')
      // 顺序：对话 / 编辑器 / 工作流 / 设置 / 最小化 / 最大化 / 关闭
      fireEvent.click(buttons[4])
      expect(mockApi.window.minimize).toHaveBeenCalled()

      fireEvent.click(buttons[5])
      expect(mockApi.window.maximize).toHaveBeenCalled()

      fireEvent.click(buttons[6])
      expect(mockApi.window.close).toHaveBeenCalled()
    })

    it('设置按钮切换设置弹窗', () => {
      render(<AppShell>content</AppShell>)
      const buttons = screen.getAllByRole('button')

      expect(screen.getByTestId('settings-dialog')).toHaveAttribute('data-open', 'false')
      fireEvent.click(buttons[3])
      expect(screen.getByTestId('settings-dialog')).toHaveAttribute('data-open', 'true')
    })

    it('挂载时读取最大化状态并订阅变化', async () => {
      mockApi.window.isMaximized.mockResolvedValue(true)
      render(<AppShell>content</AppShell>)

      await vi.waitFor(() => expect(mockApi.window.isMaximized).toHaveBeenCalled())
      expect(mockApi.window.onMaximizedChanged).toHaveBeenCalled()
    })
  })

  describe('权限与更新监听', () => {
    it('挂载时拉取权限配置并注册确认请求监听', () => {
      const fetchConfig = vi.fn().mockResolvedValue(undefined)
      mockPermissionStore.getState.mockReturnValue({
        fetchConfig,
        handleConfirmRequest: vi.fn(),
      })

      render(<AppShell>content</AppShell>)

      expect(fetchConfig).toHaveBeenCalled()
      expect(mockApi.permission.onConfirmRequest).toHaveBeenCalled()
    })

    it('权限确认请求转发给 permission store', () => {
      const handleConfirmRequest = vi.fn()
      mockPermissionStore.getState.mockReturnValue({
        fetchConfig: vi.fn(),
        handleConfirmRequest,
      })
      let captured: ((request: unknown) => void) | undefined
      mockApi.permission.onConfirmRequest.mockImplementation((cb: any) => {
        captured = cb
        return vi.fn()
      })

      render(<AppShell>content</AppShell>)
      captured?.({ id: 'req-1', toolName: 'bash' })

      expect(handleConfirmRequest).toHaveBeenCalledWith({ id: 'req-1', toolName: 'bash' })
    })

    it('挂载时初始化更新监听', () => {
      const initListeners = vi.fn(() => vi.fn())
      mockUpdateStore.getState.mockReturnValue({ initListeners })

      render(<AppShell>content</AppShell>)

      expect(initListeners).toHaveBeenCalled()
    })
  })

  describe('工作流执行', () => {
    async function executeWorkflow() {
      render(<AppShell>content</AppShell>)
      fireEvent.click(screen.getByText('app.workflow'))
      const button = await screen.findByTitle('workflow.execute')
      fireEvent.click(button)
    }

    it('没有节点时不执行', async () => {
      mockWorkflowStore.mockReturnValue({
        selectedNodeId: null,
        nodes: [],
        edges: [],
        isExecuting: false,
        nodeStatus: new Map(),
        setExecuting,
        updateNodeStatus,
        addNode: vi.fn(),
        removeNode: vi.fn(),
        selectNode: vi.fn(),
        updateNodeData: vi.fn(),
        clearWorkflow: vi.fn(),
        onNodesChange: vi.fn(),
        onEdgesChange: vi.fn(),
        onConnect: vi.fn(),
      })

      await executeWorkflow()

      expect(mockApi.workflow.execute).not.toHaveBeenCalled()
      expect(setExecuting).not.toHaveBeenCalled()
    })

    it('有节点时执行并透传当前会话 cwd', async () => {
      mockWorkflowStore.getState.mockReturnValue({
        nodes: [
          { id: 'n1', type: 'start', position: { x: 0, y: 0 }, data: { config: {} } },
          { id: 'n2', type: 'end', position: { x: 10, y: 10 }, data: { config: {} } },
        ],
        edges: [{ id: 'e1', source: 'n1', target: 'n2', sourceHandle: 'out' }],
      })
      mockWorkflowStore.mockReturnValue({
        selectedNodeId: null,
        nodes: [
          { id: 'n1', type: 'start', position: { x: 0, y: 0 }, data: { config: {} } },
          { id: 'n2', type: 'end', position: { x: 10, y: 10 }, data: { config: {} } },
        ],
        edges: [],
        isExecuting: false,
        nodeStatus: new Map(),
        setExecuting,
        updateNodeStatus,
        addNode: vi.fn(),
        removeNode: vi.fn(),
        selectNode: vi.fn(),
        updateNodeData: vi.fn(),
        clearWorkflow: vi.fn(),
        onNodesChange: vi.fn(),
        onEdgesChange: vi.fn(),
        onConnect: vi.fn(),
      })

      await executeWorkflow()

      await vi.waitFor(() => expect(mockApi.workflow.execute).toHaveBeenCalled())
      const [workflow, input, cwd] = mockApi.workflow.execute.mock.calls[0]
      expect(workflow.nodes).toHaveLength(2)
      expect(workflow.edges).toEqual([
        { id: 'e1', source: 'n1', target: 'n2', sourceHandle: 'out', targetHandle: undefined },
      ])
      expect(input).toEqual({})
      expect(cwd).toBe('/workspace/app')
      expect(setExecuting).toHaveBeenNthCalledWith(1, true)
      expect(setExecuting).toHaveBeenLastCalledWith(false)
    })

    it('进度事件更新节点状态，结束后解除订阅', async () => {
      let progressCb: ((progress: unknown) => void) | undefined
      const unsubscribe = vi.fn()
      mockApi.workflow.onProgress.mockImplementation((cb: any) => {
        progressCb = cb
        return unsubscribe
      })
      mockWorkflowStore.getState.mockReturnValue({
        nodes: [{ id: 'n1', type: 'start', position: { x: 0, y: 0 }, data: {} }],
        edges: [],
      })
      mockWorkflowStore.mockReturnValue({
        selectedNodeId: null,
        nodes: [{ id: 'n1', type: 'start', position: { x: 0, y: 0 }, data: {} }],
        edges: [],
        isExecuting: false,
        nodeStatus: new Map(),
        setExecuting,
        updateNodeStatus,
        addNode: vi.fn(),
        removeNode: vi.fn(),
        selectNode: vi.fn(),
        updateNodeData: vi.fn(),
        clearWorkflow: vi.fn(),
        onNodesChange: vi.fn(),
        onEdgesChange: vi.fn(),
        onConnect: vi.fn(),
      })

      await executeWorkflow()
      await vi.waitFor(() => expect(progressCb).toBeDefined())

      act(() => {
        progressCb!({ nodeId: 'n1', status: 'running' })
      })
      expect(updateNodeStatus).toHaveBeenCalledWith({ nodeId: 'n1', status: 'running' })

      await vi.waitFor(() => expect(unsubscribe).toHaveBeenCalled())
    })

    it('执行失败时仍复位状态并解除订阅', async () => {
      const unsubscribe = vi.fn()
      mockApi.workflow.onProgress.mockReturnValue(unsubscribe)
      mockApi.workflow.execute.mockRejectedValue(new Error('execution failed'))
      mockWorkflowStore.getState.mockReturnValue({
        nodes: [{ id: 'n1', type: 'start', position: { x: 0, y: 0 }, data: {} }],
        edges: [],
      })
      mockWorkflowStore.mockReturnValue({
        selectedNodeId: null,
        nodes: [{ id: 'n1', type: 'start', position: { x: 0, y: 0 }, data: {} }],
        edges: [],
        isExecuting: false,
        nodeStatus: new Map(),
        setExecuting,
        updateNodeStatus,
        addNode: vi.fn(),
        removeNode: vi.fn(),
        selectNode: vi.fn(),
        updateNodeData: vi.fn(),
        clearWorkflow: vi.fn(),
        onNodesChange: vi.fn(),
        onEdgesChange: vi.fn(),
        onConnect: vi.fn(),
      })

      await executeWorkflow()

      await vi.waitFor(() => expect(unsubscribe).toHaveBeenCalled())
      expect(setExecuting).toHaveBeenLastCalledWith(false)
    })
  })

  describe('面板拖拽', () => {
    it('侧边栏宽度在 180-480 之间夹紧', () => {
      render(<AppShell>content</AppShell>)
      const sidebar = screen.getByTestId('sidebar')
      const onResize = resizeCallbacks[0]

      act(() => onResize(100))
      expect(screen.getByTestId('sidebar').getAttribute('data-width')).toBe('356')

      act(() => onResize(-1000))
      expect(screen.getByTestId('sidebar').getAttribute('data-width')).toBe('180')

      act(() => onResize(1000))
      expect(screen.getByTestId('sidebar').getAttribute('data-width')).toBe('480')
      expect(sidebar).toBeInTheDocument()
    })
  })
})
