import { useState } from 'react'
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Loader2, Wrench } from 'lucide-react'
import { CodeBlock } from './CodeBlock'

interface ToolCall {
  toolName: string
  parameters: Record<string, unknown>
  status: 'pending' | 'running' | 'success' | 'error'
  result?: unknown
  error?: string
}

interface ToolCallCardProps {
  toolCall: ToolCall
}

export function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const statusIcon = {
    pending: <Loader2 className='h-4 w-4 animate-spin text-yellow-500' />,
    running: <Loader2 className='h-4 w-4 animate-spin text-blue-500' />,
    success: <CheckCircle className='h-4 w-4 text-green-500' />,
    error: <XCircle className='h-4 w-4 text-red-500' />,
  }

  const statusText = {
    pending: '等待中',
    running: '执行中',
    success: '成功',
    error: '失败',
  }

  const formatParameters = (params: Record<string, unknown>): string => {
    return JSON.stringify(params, null, 2)
  }

  const formatResult = (result: unknown): string => {
    if (typeof result === 'string') return result
    return JSON.stringify(result, null, 2)
  }

  return (
    <div className='my-2 rounded-lg border bg-muted/50 overflow-hidden'>
      <button
        className='flex w-full items-center gap-2 px-3 py-2 hover:bg-muted/80 transition-colors'
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Wrench className='h-4 w-4 text-muted-foreground' />
        <span className='font-medium text-sm'>{toolCall.toolName}</span>
        <span className='ml-auto flex items-center gap-1.5 text-xs text-muted-foreground'>
          {statusIcon[toolCall.status]}
          {statusText[toolCall.status]}
        </span>
        {isExpanded ? (
          <ChevronDown className='h-4 w-4 text-muted-foreground' />
        ) : (
          <ChevronRight className='h-4 w-4 text-muted-foreground' />
        )}
      </button>

      {isExpanded && (
        <div className='border-t px-3 py-2 space-y-2'>
          <div>
            <p className='text-xs font-medium text-muted-foreground mb-1'>参数</p>
            <CodeBlock code={formatParameters(toolCall.parameters)} language='json' />
          </div>

          {toolCall.result !== undefined && (
            <div>
              <p className='text-xs font-medium text-muted-foreground mb-1'>结果</p>
              <CodeBlock code={formatResult(toolCall.result)} language='json' />
            </div>
          )}

          {toolCall.error && (
            <div>
              <p className='text-xs font-medium text-red-500 mb-1'>错误</p>
              <pre className='rounded bg-red-500/10 p-2 text-xs text-red-600 overflow-x-auto'>
                {toolCall.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
