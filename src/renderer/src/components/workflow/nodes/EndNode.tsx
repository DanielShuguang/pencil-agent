import { Square } from 'lucide-react'
import { BaseNode } from './BaseNode'

interface EndNodeProps {
  id: string
  data: Record<string, unknown>
}

export function EndNode({ id }: EndNodeProps) {
  return (
    <BaseNode nodeId={id} hasOutput={false}>
      <div className='flex items-center gap-2'>
        <Square className='h-4 w-4 text-red-500' />
        <span className='font-medium text-sm'>结束</span>
      </div>
    </BaseNode>
  )
}
