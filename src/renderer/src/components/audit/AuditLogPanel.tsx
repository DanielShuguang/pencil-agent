import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight, CheckCircle, XCircle, ShieldOff, Trash2 } from 'lucide-react'
import type { AuditLogEntry } from '@shared/ipc'
import { Button } from '../ui/button'
import { useAgentStore } from '../../stores/agent-store'

const statusIcons = {
  success: CheckCircle,
  error: XCircle,
  denied: ShieldOff,
}

const statusColors = {
  success: 'text-green-500',
  error: 'text-red-500',
  denied: 'text-yellow-500',
}

function formatResult(result: unknown): string {
  if (typeof result === 'string') return result
  try {
    return JSON.stringify(result, null, 2)
  } catch {
    return String(result)
  }
}

export function AuditLogPanel() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { activeSessionId } = useAgentStore()
  const { t } = useTranslation()

  const fetchLogs = async () => {
    if (!activeSessionId) return
    setIsLoading(true)
    try {
      const result = await window.api.audit.getLogs(activeSessionId)
      setLogs(result as AuditLogEntry[])
    } catch {
      setLogs([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void fetchLogs()
  }, [activeSessionId])

  const handleClear = async () => {
    await window.api.audit.clearLogs()
    setLogs([])
  }

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString()
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <div className='flex flex-col h-full'>
      <div className='flex items-center justify-between p-3 border-b'>
        <span className='text-sm font-medium'>{t('permission.auditLog')}</span>
        <div className='flex gap-1'>
          <Button size='sm' variant='ghost' onClick={fetchLogs} disabled={isLoading}>
            {t('common.refresh')}
          </Button>
          <Button size='sm' variant='ghost' onClick={handleClear}>
            <Trash2 className='h-3 w-3' />
          </Button>
        </div>
      </div>

      <div className='flex-1 overflow-auto'>
        {logs.length === 0 ? (
          <div className='p-4 text-sm text-muted-foreground text-center'>
            {t('common.noData')}
          </div>
        ) : (
          <div className='space-y-1 p-2'>
            {logs.map((log) => {
              const StatusIcon = statusIcons[log.status]
              const isExpanded = expandedId === log.id

              return (
                <div key={log.id} className='rounded-md border'>
                  <button
                    className='flex items-center w-full gap-2 p-2 text-left hover:bg-muted'
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className='h-3 w-3 shrink-0' />
                    ) : (
                      <ChevronRight className='h-3 w-3 shrink-0' />
                    )}
                    <StatusIcon className={`h-4 w-4 shrink-0 ${statusColors[log.status]}`} />
                    <span className='text-sm font-medium'>{log.toolName}</span>
                    <span className='text-xs text-muted-foreground ml-auto'>
                      {formatDuration(log.duration)}
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      {formatTime(log.timestamp)}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className='border-t p-3 space-y-2'>
                      <div>
                        <div className='text-xs font-medium mb-1'>{t('permission.parameters')}</div>
                        <pre className='text-xs text-muted-foreground bg-muted p-2 rounded overflow-auto max-h-32'>
                          {JSON.stringify(log.parameters, null, 2)}
                        </pre>
                      </div>

                      {log.result !== null && log.result !== undefined && (
                        <div>
                          <div className='text-xs font-medium mb-1'>{t('permission.result')}</div>
                          <pre className='text-xs text-muted-foreground bg-muted p-2 rounded overflow-auto max-h-32'>
                            {formatResult(log.result)}
                          </pre>
                        </div>
                      )}

                      {log.error && (
                        <div>
                          <div className='text-xs font-medium mb-1 text-destructive'>{t('permission.error')}</div>
                          <div className='text-xs text-destructive bg-destructive/10 p-2 rounded'>
                            {log.error}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
