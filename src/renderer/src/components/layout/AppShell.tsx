import { useState, useEffect, type ReactNode } from 'react'
import { Minus, Square, X, Maximize2, MessageSquare, Code2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { EditorPanel } from '../code-editor/EditorPanel'
import { FileTree } from '../code-editor/FileTree'
import { TabBar } from '../code-editor/TabBar'
import { TerminalPanel } from '../code-editor/TerminalPanel'

interface AppShellProps {
  children: ReactNode
}

type PanelTab = 'chat' | 'editor'

export function AppShell({ children }: AppShellProps) {
  const [isMaximized, setIsMaximized] = useState(false)
  const [activeTab, setActiveTab] = useState<PanelTab>('chat')
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(true)

  useEffect(() => {
    window.api.window.isMaximized().then(setIsMaximized)
    const cleanup = window.api.window.onMaximizedChanged(setIsMaximized)
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
            对话
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
            编辑器
          </button>
          <div className='w-px h-6 bg-border mx-2' />
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
      <main className='flex-1 overflow-hidden flex flex-col'>
        {activeTab === 'chat' ? (
          children
        ) : (
          <div className='flex-1 flex overflow-hidden'>
            <div className='w-48 border-r bg-muted/20 overflow-auto'>
              <div className='p-2'>
                <h3 className='text-xs font-medium text-muted-foreground mb-2 px-2'>
                  文件
                </h3>
                <FileTree />
              </div>
            </div>
            <div className='flex-1 flex flex-col overflow-hidden'>
              <TabBar />
              <EditorPanel className='flex-1' />
              <TerminalPanel
                isCollapsed={isTerminalCollapsed}
                onToggleCollapse={() => setIsTerminalCollapsed(!isTerminalCollapsed)}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
