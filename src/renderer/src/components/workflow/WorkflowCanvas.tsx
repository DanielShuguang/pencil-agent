import { useCallback, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type NodeTypes,
  type ReactFlowInstance,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useWorkflowStore } from '../../stores/workflow-store'
import { StartNode, EndNode, AgentNode, ToolNode, ConditionNode } from './nodes'

const nodeTypes: NodeTypes = {
  start: StartNode,
  end: EndNode,
  agent: AgentNode,
  tool: ToolNode,
  condition: ConditionNode,
}

interface WorkflowCanvasProps {
  className?: string
}

export function WorkflowCanvas({ className }: WorkflowCanvasProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, selectNode } = useWorkflowStore()

  const reactFlowRef = useRef<ReactFlowInstance | null>(null)

  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowRef.current = instance
  }, [])

  const onPaneClick = useCallback(() => {
    selectNode(null)
  }, [selectNode])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()

    const type = event.dataTransfer.getData('application/reactflow')
    if (!type || !reactFlowRef.current) return

    const position = reactFlowRef.current.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    })

    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: { config: {} },
    }

    useWorkflowStore.getState().addNode(newNode)
  }, [])

  return (
    <div className={className}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}
