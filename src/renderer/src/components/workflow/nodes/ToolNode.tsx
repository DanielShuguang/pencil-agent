import { Wrench } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BaseNode } from './BaseNode'

interface ToolNodeProps {
  id: string
  data: Record<string, unknown>
}

export function ToolNode({ id, data }: ToolNodeProps) {
  const { t } = useTranslation()
  const config = data.config as {
    toolName?: string
  } | undefined

  return (
    <BaseNode nodeId={id}>
      <div className='flex items-center gap-2'>
        <Wrench className='h-4 w-4 text-orange-500' />
        <span className='font-medium text-sm'>{t('workflow.toolNode')}</span>
      </div>
      {config?.toolName && (
        <p className='text-xs text-muted-foreground mt-1 truncate'>
          {config.toolName}
        </p>
      )}
    </BaseNode>
  )
}
