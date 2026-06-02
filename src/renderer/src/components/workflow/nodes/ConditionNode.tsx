import { Position } from '@xyflow/react'
import { GitBranch } from 'lucide-react'
import { BaseNode } from './BaseNode'

interface ConditionNodeProps {
  id: string
  data: Record<string, unknown>
}

export function ConditionNode({ id, data }: ConditionNodeProps) {
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
        <span className='font-medium text-sm'>条件</span>
      </div>
      {config?.expression && (
        <p className='text-xs text-muted-foreground mt-1 truncate'>
          {config.expression}
        </p>
      )}
      <div className='flex justify-between mt-2 text-xs'>
        <span className='text-green-500'>是</span>
        <span className='text-red-500'>否</span>
      </div>
    </BaseNode>
  )
}
