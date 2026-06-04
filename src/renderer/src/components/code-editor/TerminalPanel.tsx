import { useEffect, useRef } from 'react'
import { Terminal, X, Trash2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useSandboxStore } from '../../stores/sandbox-store'

interface TerminalPanelProps {
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function TerminalPanel({ isCollapsed = false, onToggleCollapse }: TerminalPanelProps) {
  const { executions, activeExecutionId, clearAll } = useSandboxStore()
  const outputRef = useRef<HTMLDivElement>(null)

  const activeExecution = activeExecutionId ? executions.get(activeExecutionId) : null

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [activeExecution?.output])

  useEffect(() => {
    const unsubscribe = window.api.sandbox.onOutput((output) => {
      useSandboxStore.getState().appendOutput(output)
    })
    return unsubscribe
  }, [])

  if (isCollapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className='flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 border-t w-full'
      >
        <Terminal className='h-3.5 w-3.5' />
        终端
      </button>
    )
  }

  return (
    <div className='border-t flex flex-col h-48'>
      <div className='flex items-center justify-between px-3 py-1.5 bg-muted/30 border-b'>
        <div className='flex items-center gap-2'>
          <Terminal className='h-3.5 w-3.5 text-muted-foreground' />
          <span className='text-xs font-medium'>终端</span>
          {activeExecution && (
            <span className='text-xs text-muted-foreground'>{activeExecution.language}</span>
          )}
        </div>
        <div className='flex items-center gap-1'>
          {executions.size > 0 && (
            <button
              onClick={clearAll}
              className='p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground'
              title='清除所有'
            >
              <Trash2 className='h-3.5 w-3.5' />
            </button>
          )}
          <button
            onClick={onToggleCollapse}
            className='p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground'
            title='收起'
          >
            <X className='h-3.5 w-3.5' />
          </button>
        </div>
      </div>

      <div ref={outputRef} className='flex-1 overflow-auto bg-[#0d1117] p-2 font-mono text-xs'>
        {activeExecution ? (
          <>
            {activeExecution.output.map((line, i) => (
              <div
                key={i}
                className={cn(
                  'whitespace-pre-wrap',
                  line.type === 'stderr' ? 'text-red-400' : 'text-gray-300',
                  line.type === 'exit' && 'mt-2 pt-2 border-t border-gray-700',
                )}
              >
                {line.type === 'exit' ? (
                  <span className={cn(line.exitCode === 0 ? 'text-green-400' : 'text-red-400')}>
                    进程退出，退出码: {line.exitCode}
                  </span>
                ) : (
                  line.content
                )}
              </div>
            ))}
            {activeExecution.status === 'running' && (
              <span className='inline-block w-2 h-4 bg-gray-400 animate-pulse' />
            )}
          </>
        ) : (
          <div className='text-gray-500 flex items-center justify-center h-full'>
            暂无运行中的进程
          </div>
        )}
      </div>
    </div>
  )
}
