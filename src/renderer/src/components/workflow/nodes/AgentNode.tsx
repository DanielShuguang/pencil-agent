import { Bot } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BaseNode } from './BaseNode'

interface AgentNodeProps {
  id: string
  data: Record<string, unknown>
}

export function AgentNode({ id, data }: AgentNodeProps) {
  const { t } = useTranslation()
  const config = data.config as
    | {
        model?: { id: string; provider: string }
        systemPrompt?: string
      }
    | undefined

  return (
    <BaseNode nodeId={id}>
      <div className='flex items-center gap-2'>
        <Bot className='h-4 w-4 text-blue-500' />
        <span className='font-medium text-sm'>{t('workflow.agent')}</span>
      </div>
      {config?.model && (
        <p className='text-xs text-muted-foreground mt-1 truncate'>{config.model.id}</p>
      )}
    </BaseNode>
  )
}
