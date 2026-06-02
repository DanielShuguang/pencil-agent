import { Play } from 'lucide-react'
import { BaseNode } from './BaseNode'

interface StartNodeProps {
  id: string
  data: Record<string, unknown>
}

export function StartNode({ id }: StartNodeProps) {
  return (
    <BaseNode nodeId={id} hasInput={false}>
      <div className='flex items-center gap-2'>
        <Play className='h-4 w-4 text-green-500' />
        <span className='font-medium text-sm'>开始</span>
      </div>
    </BaseNode>
  )
}
