import { Position } from '@xyflow/react'
import { GitBranch } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BaseNode } from './BaseNode'

interface ConditionNodeProps {
  id: string
  data: Record<string, unknown>
}

export function ConditionNode({ id, data }: ConditionNodeProps) {
  const { t } = useTranslation()
  const config = data.config as {
    expression?: string
  } | undefined

  return (
    <BaseNode
      nodeId={id}
      outputHandles={[
        { id: 'true', position: Position.Bottom },
        { id: 'false', position: Position.Bottom },
      ]}
    >
      <div className='flex items-center gap-2'>
        <GitBranch className='h-4 w-4 text-purple-500' />
        <span className='font-medium text-sm'>{t('workflow.conditionNode')}</span>
      </div>
      {config?.expression && (
        <p className='text-xs text-muted-foreground mt-1 truncate'>
          {config.expression}
        </p>
      )}
      <div className='flex justify-between mt-2 text-xs'>
        <span className='text-green-500'>{t('workflow.yes')}</span>
        <span className='text-red-500'>{t('workflow.no')}</span>
      </div>
    </BaseNode>
  )
}
