import { useState, useEffect, useCallback, lazy, Suspense, type ReactNode } from 'react'
import { Minus, Square, X, Maximize2, MessageSquare, Code2, Workflow, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { match } from 'ts-pattern'
import { cn } from '../../lib/utils'
import { Sidebar } from '../sidebar/Sidebar'
import { SettingsDialog } from '../settings/SettingsDialog'
import { StatusBar } from './StatusBar'
import { Loading } from '../ui/loading'
import { ResizeHandle } from '../ui/resize-handle'
import { PermissionConfirmDialog } from '../permission/PermissionConfirmDialog'
import { usePermissionStore } from '../../stores/permission-store'
import { useWorkflowStore } from '../../stores/workflow-store'
import { useUpdateStore } from '../../stores/update-store'
import type { WorkflowNode } from '@shared/ipc'

const EditorPanel = lazy(() =>
  import('../code-editor/EditorPanel').then((m) => ({ default: m.EditorPanel })),
)
const FileTree = lazy(() =>
  import('../code-editor/FileTree').then((m) => ({ default: m.FileTree })),
)
const TabBar = lazy(() => import('../code-editor/TabBar').then((m) => ({ default: m.TabBar })))
const TerminalPanel = lazy(() =>
  import('../code-editor/TerminalPanel').then((m) => ({ default: m.TerminalPanel })),
)
const WorkflowCanvas = lazy(() =>
  import('../workflow/WorkflowCanvas').then((m) => ({ default: m.WorkflowCanvas })),
)
const WorkflowToolbar = lazy(() =>
  import('../workflow/WorkflowToolbar').then((m) => ({ default: m.WorkflowToolbar })),
)
const NodeConfigPanel = lazy(() =>
  import('../workflow/panels/NodeConfigPanel').then((m) => ({ default: m.NodeConfigPanel })),
)

interface AppShellProps {
  children: ReactNode
}

type PanelTab = 'chat' | 'editor' | 'workflow'

export function AppShell({ children }: AppShellProps) {
  const [isMaximized, setIsMaximized] = useState(false)
  const [activeTab, setActiveTab] = useState<PanelTab>('chat')
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(true)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(256)
  const [fileTreeWidth, setFileTreeWidth] = useState(192)
  const [nodeConfigWidth, setNodeConfigWidth] = useState(288)
  const { selectedNodeId, setExecuting, updateNodeStatus } = useWorkflowStore()
  const { t } = useTranslation()

  const handleSidebarResize = useCallback((delta: number) => {
    setSidebarWidth((prev) => Math.max(180, Math.min(480, prev + delta)))
  }, [])

  const handleFileTreeResize = useCallback((delta: number) => {
    setFileTreeWidth((prev) => Math.max(120, Math.min(400, prev + delta)))
  }, [])

  const handleNodeConfigResize = useCallback((delta: number) => {
    setNodeConfigWidth((prev) => Math.max(200, Math.min(500, prev + delta)))
  }, [])

  const handleExecute = useCallback(async () => {
    const { nodes: currentNodes, edges: currentEdges } = useWorkflowStore.getState()
    if (currentNodes.length === 0) return

    const workflow = {
      id: `workflow-${Date.now()}`,
      name: 'My Workflow',
      nodes: currentNodes.map((n) => ({
        id: n.id,
        type: n.type as WorkflowNode['type'],
        data: n.data,
        position: n.position,
      })),
      edges: currentEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle ?? undefined,
        targetHandle: e.targetHandle ?? undefined,
      })),
    }

    setExecuting(true)

    const unsubscribe = window.api.workflow.onProgress((progress) => {
      updateNodeStatus(progress)
      if (progress.status === 'error') {
        setExecuting(false)
      }
    })

    try {
      await window.api.workflow.execute(workflow, {})
      setExecuting(false)
    } catch {
      setExecuting(false)
    } finally {
      unsubscribe()
    }
  }, [setExecuting, updateNodeStatus])

  useEffect(() => {
    window.api.window.isMaximized().then(setIsMaximized)
    const cleanup = window.api.window.onMaximizedChanged(setIsMaximized)
    return cleanup
  }, [])

  // 权限确认请求监听
  useEffect(() => {
    const { fetchConfig, handleConfirmRequest } = usePermissionStore.getState()
    fetchConfig()
    const cleanup = window.api.permission.onConfirmRequest((request) => {
      handleConfirmRequest(request as any)
    })
    return cleanup
  }, [])

  useEffect(() => {
    const cleanup = useUpdateStore.getState().initListeners()
    return cleanup
  }, [])

  return (
    <div className='flex h-screen flex-col bg-background text-foreground'>
      <header
        className='flex h-10 shrink-0 items-center justify-between border-b border-border bg-background px-4'
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className='flex items-center gap-2'>
          <div className='h-6 w-6 rounded-full bg-primary' />
          <span className='text-sm font-semibold'>Pencil Agent</span>
        </div>
        <div
          className='flex items-center gap-1'
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={() => setActiveTab('chat')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors',
              activeTab === 'chat'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted',
            )}
          >
            <MessageSquare className='h-3.5 w-3.5' />
            {t('app.chat')}
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors',
              activeTab === 'editor'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted',
            )}
          >
            <Code2 className='h-3.5 w-3.5' />
            {t('app.editor')}
          </button>
          <button
            onClick={() => setActiveTab('workflow')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors',
              activeTab === 'workflow'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted',
            )}
          >
            <Workflow className='h-3.5 w-3.5' />
            {t('app.workflow')}
          </button>
          <div className='w-px h-6 bg-border mx-2' />
          <button
            className='flex h-10 w-11 items-center justify-center hover:bg-muted'
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          >
            <Settings className='h-4 w-4' />
          </button>
          <button
            className='flex h-10 w-11 items-center justify-center hover:bg-muted'
            onClick={() => window.api.window.minimize()}
          >
            <Minus className='h-4 w-4' />
          </button>
          <button
            className='flex h-10 w-11 items-center justify-center hover:bg-muted'
            onClick={() => window.api.window.maximize()}
          >
            {isMaximized ? (
              <Maximize2 className='h-3.5 w-3.5' />
            ) : (
              <Square className='h-3.5 w-3.5' />
            )}
          </button>
          <button
            className='flex h-10 w-11 items-center justify-center hover:bg-destructive hover:text-destructive-foreground'
            onClick={() => window.api.window.close()}
          >
            <X className='h-4 w-4' />
          </button>
        </div>
      </header>
      <main className='flex-1 overflow-hidden flex'>
        {activeTab === 'chat' && (
          <>
            <Sidebar width={sidebarWidth} />
            <ResizeHandle direction='horizontal' onResize={handleSidebarResize} />
          </>
        )}
        <div className='flex-1 flex flex-col overflow-hidden'>
          <div key={activeTab} className='flex-1 flex flex-col overflow-hidden animate-in fade-in-0 slide-in-from-bottom-2 duration-150'>
          {match(activeTab)
            .with('chat', () => children)
            .with('editor', () => (
              <Suspense fallback={<Loading />}>
                <div className='flex-1 flex overflow-hidden'>
                  <div className='border-r bg-muted/20 overflow-auto' style={{ width: fileTreeWidth }}>
                    <div className='p-2'>
                      <h3 className='text-xs font-medium text-muted-foreground mb-2 px-2'>
                        {t('app.file')}
                      </h3>
                      <FileTree />
                    </div>
                  </div>
                  <ResizeHandle direction='horizontal' onResize={handleFileTreeResize} />
                  <div className='flex-1 flex flex-col overflow-hidden'>
                    <TabBar />
                    <EditorPanel className='flex-1' />
                    <TerminalPanel
                      isCollapsed={isTerminalCollapsed}
                      onToggleCollapse={() => setIsTerminalCollapsed(!isTerminalCollapsed)}
                    />
                  </div>
                </div>
              </Suspense>
            ))
            .with('workflow', () => (
              <Suspense fallback={<Loading />}>
                <div className='flex-1 flex flex-col overflow-hidden'>
                  <WorkflowToolbar onExecute={handleExecute} />
                  <div className='flex-1 flex overflow-hidden'>
                    <WorkflowCanvas className='flex-1' />
                    {selectedNodeId && (
                      <>
                        <ResizeHandle direction='horizontal' onResize={handleNodeConfigResize} />
                        <NodeConfigPanel style={{ width: nodeConfigWidth }} />
                      </>
                    )}
                  </div>
                </div>
              </Suspense>
            ))
            .exhaustive()}
          </div>
        </div>
      </main>
      <StatusBar />
      <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <PermissionConfirmDialog />
    </div>
  )
}
