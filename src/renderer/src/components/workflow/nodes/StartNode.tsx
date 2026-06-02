import { Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BaseNode } from './BaseNode'

interface StartNodeProps {
  id: string
  data: Record<string, unknown>
}

export function StartNode({ id }: StartNodeProps) {
  const { t } = useTranslation()
  return (
    <BaseNode nodeId={id} hasInput={false}>
      <div className='flex items-center gap-2'>
        <Play className='h-4 w-4 text-green-500' />
        <span className='font-medium text-sm'>{t('workflow.start')}</span>
      </div>
    </BaseNode>
  )
}
