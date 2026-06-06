import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Terminal, X, Trash2, ChevronUp } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useSandboxStore } from '../../stores/sandbox-store'

interface TerminalPanelProps {
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function TerminalPanel({ isCollapsed = false, onToggleCollapse }: TerminalPanelProps) {
  const { executions, activeExecutionId, clearAll } = useSandboxStore()
  const outputRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()

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

  return (
    <div
      className={cn(
        'border-t transition-all duration-200 ease-out flex flex-col',
        isCollapsed ? 'h-8' : 'h-48',
      )}
    >
      <div className='flex items-center justify-between px-3 py-1.5 bg-muted/30 border-b shrink-0'>
        <div className='flex items-center gap-2'>
          <Terminal className='h-3.5 w-3.5 text-muted-foreground' />
          <span className='text-xs font-medium'>{t('editor.terminal')}</span>
          {activeExecution && (
            <span className='text-xs text-muted-foreground'>{activeExecution.language}</span>
          )}
        </div>
        <div className='flex items-center gap-1'>
          {executions.size > 0 && (
            <button
              onClick={clearAll}
              className='p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground'
              title={t('editor.clearAll')}
            >
              <Trash2 className='h-3.5 w-3.5' />
            </button>
          )}
          <button
            onClick={onToggleCollapse}
            className='p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground'
          >
            {isCollapsed ? (
              <ChevronUp className='h-3.5 w-3.5 rotate-180' />
            ) : (
              <X className='h-3.5 w-3.5' />
            )}
          </button>
        </div>
      </div>

      <div
        ref={outputRef}
        className={cn(
          'flex-1 overflow-auto bg-[#0d1117] p-2 font-mono text-xs transition-opacity duration-200',
          isCollapsed && 'opacity-0',
        )}
      >
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
                    {t('editor.processExit', { code: line.exitCode })}
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
          <div className='text-gray-500 italic'>{t('editor.waiting')}</div>
        )}
      </div>
    </div>
  )
}
