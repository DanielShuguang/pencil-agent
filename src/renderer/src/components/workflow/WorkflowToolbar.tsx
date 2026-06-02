import { Play, Save, Upload, Trash2, Plus } from 'lucide-react'
import { useWorkflowStore } from '../../stores/workflow-store'

interface WorkflowToolbarProps {
  className?: string
  onExecute?: () => void
}

export function WorkflowToolbar({ className, onExecute }: WorkflowToolbarProps) {
  const { nodes, edges, isExecuting, clearWorkflow, addNode } = useWorkflowStore()

  const handleAddNode = (type: string) => {
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 250, y: 150 },
      data: { config: {} },
    }
    addNode(newNode)
  }

  const handleSave = () => {
    const workflow = {
      id: `workflow-${Date.now()}`,
      name: 'My Workflow',
      nodes,
      edges,
    }
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'workflow.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleLoad = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const workflow = JSON.parse(event.target?.result as string)
          useWorkflowStore.getState().setNodes(workflow.nodes ?? [])
          useWorkflowStore.getState().setEdges(workflow.edges ?? [])
        } catch {
          alert('无效的工作流文件')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <div className={`flex items-center gap-2 p-2 border-b bg-muted/30 ${className}`}>
      <div className='flex items-center gap-1'>
        <button
          onClick={() => handleAddNode('start')}
          className='flex items-center gap-1 px-2 py-1.5 text-xs bg-background border rounded hover:bg-muted'
          title='添加开始节点'
        >
          <Plus className='h-3 w-3' />
          开始
        </button>
        <button
          onClick={() => handleAddNode('agent')}
          className='flex items-center gap-1 px-2 py-1.5 text-xs bg-background border rounded hover:bg-muted'
          title='添加 Agent 节点'
        >
          <Plus className='h-3 w-3' />
          Agent
        </button>
        <button
          onClick={() => handleAddNode('tool')}
          className='flex items-center gap-1 px-2 py-1.5 text-xs bg-background border rounded hover:bg-muted'
          title='添加工具节点'
        >
          <Plus className='h-3 w-3' />
          工具
        </button>
        <button
          onClick={() => handleAddNode('condition')}
          className='flex items-center gap-1 px-2 py-1.5 text-xs bg-background border rounded hover:bg-muted'
          title='添加条件节点'
        >
          <Plus className='h-3 w-3' />
          条件
        </button>
        <button
          onClick={() => handleAddNode('end')}
          className='flex items-center gap-1 px-2 py-1.5 text-xs bg-background border rounded hover:bg-muted'
          title='添加结束节点'
        >
          <Plus className='h-3 w-3' />
          结束
        </button>
      </div>

      <div className='w-px h-6 bg-border' />

      <button
        onClick={onExecute}
        disabled={isExecuting || nodes.length === 0}
        className='flex items-center gap-1 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50'
        title='执行工作流'
      >
        <Play className='h-3 w-3' />
        {isExecuting ? '执行中...' : '执行'}
      </button>

      <div className='w-px h-6 bg-border' />

      <button
        onClick={handleSave}
        disabled={nodes.length === 0}
        className='flex items-center gap-1 px-2 py-1.5 text-xs bg-background border rounded hover:bg-muted disabled:opacity-50'
        title='保存工作流'
      >
        <Save className='h-3 w-3' />
        保存
      </button>
      <button
        onClick={handleLoad}
        className='flex items-center gap-1 px-2 py-1.5 text-xs bg-background border rounded hover:bg-muted'
        title='加载工作流'
      >
        <Upload className='h-3 w-3' />
        加载
      </button>

      <div className='flex-1' />

      <button
        onClick={clearWorkflow}
        disabled={nodes.length === 0}
        className='flex items-center gap-1 px-2 py-1.5 text-xs text-destructive bg-background border rounded hover:bg-destructive/10 disabled:opacity-50'
        title='清空画布'
      >
        <Trash2 className='h-3 w-3' />
        清空
      </button>
    </div>
  )
}
