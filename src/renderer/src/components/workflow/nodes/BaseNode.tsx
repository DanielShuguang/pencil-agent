import { type ReactNode } from 'react'
import { Handle, Position } from '@xyflow/react'
import { cn } from '../../../lib/utils'
import { useWorkflowStore } from '../../../stores/workflow-store'

interface BaseNodeProps {
  children: ReactNode
  nodeId: string
  hasInput?: boolean
  hasOutput?: boolean
  outputHandles?: Array<{ id: string; position: Position }>
  className?: string
}

export function BaseNode({
  children,
  nodeId,
  hasInput = true,
  hasOutput = true,
  outputHandles,
  className,
}: BaseNodeProps) {
  const { selectedNodeId, nodeStatus, selectNode } = useWorkflowStore()
  const isSelected = selectedNodeId === nodeId
  const status = nodeStatus.get(nodeId)

  const statusStyles = {
    pending: 'border-gray-300',
    running: 'border-blue-500 animate-pulse',
    success: 'border-green-500',
    error: 'border-red-500',
  }

  return (
    <div
      className={cn(
        'rounded-lg border-2 bg-background p-3 shadow-md min-w-[150px] cursor-pointer transition-colors',
        isSelected ? 'border-primary' : statusStyles[status ?? 'pending'],
        className,
      )}
      onClick={() => selectNode(nodeId)}
    >
      {hasInput && <Handle type='target' position={Position.Top} className='w-3 h-3 !bg-primary' />}
      {children}
      {hasOutput && !outputHandles && (
        <Handle type='source' position={Position.Bottom} className='w-3 h-3 !bg-primary' />
      )}
      {outputHandles?.map((handle) => (
        <Handle
          key={handle.id}
          type='source'
          position={handle.position}
          id={handle.id}
          className='w-3 h-3 !bg-primary'
        />
      ))}
    </div>
  )
}
