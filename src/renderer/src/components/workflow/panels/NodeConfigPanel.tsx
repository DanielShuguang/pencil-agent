import { useWorkflowStore } from '../../../stores/workflow-store'
import { useToolStore } from '../../../stores/tool-store'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'

interface NodeConfigPanelProps {
  className?: string
}

export function NodeConfigPanel({ className }: NodeConfigPanelProps) {
  const { nodes, selectedNodeId, updateNodeData, selectNode } = useWorkflowStore()
  const { tools } = useToolStore()
  const { t } = useTranslation()

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)

  if (!selectedNode) {
    return null
  }

  const config = (selectedNode.data.config as Record<string, unknown>) ?? {}

  const handleChange = (key: string, value: unknown) => {
    updateNodeData(selectedNode.id, {
      config: { ...config, [key]: value },
    })
  }

  return (
    <div className={`border-l bg-background p-4 overflow-auto ${className}`}>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='font-medium text-sm'>{t('workflow.nodeConfig')}</h3>
        <button
          onClick={() => selectNode(null)}
          className='p-1 hover:bg-muted rounded'
        >
          <X className='h-4 w-4' />
        </button>
      </div>

      <div className='space-y-4'>
        <div>
          <label className='text-xs font-medium text-muted-foreground'>{t('workflow.nodeId')}</label>
          <p className='text-sm mt-1'>{selectedNode.id}</p>
        </div>

        <div>
          <label className='text-xs font-medium text-muted-foreground'>{t('workflow.nodeType')}</label>
          <p className='text-sm mt-1'>{selectedNode.type}</p>
        </div>

        {selectedNode.type === 'agent' && (
          <>
            <div>
              <label className='text-xs font-medium text-muted-foreground'>{t('workflow.model')}</label>
              <Select
                value={JSON.stringify(config.model ?? { id: 'claude-sonnet-4-20250514', provider: 'anthropic' })}
                onValueChange={(value) => handleChange('model', JSON.parse(value))}
              >
                <SelectTrigger className='w-full mt-1'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={JSON.stringify({ id: 'claude-sonnet-4-20250514', provider: 'anthropic' })}>
                    Claude Sonnet 4
                  </SelectItem>
                  <SelectItem value={JSON.stringify({ id: 'gpt-4o', provider: 'openai' })}>
                    GPT-4o
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className='text-xs font-medium text-muted-foreground'>System Prompt</label>
              <textarea
                className='w-full mt-1 rounded-md border bg-background px-3 py-2 text-sm min-h-[100px]'
                value={(config.systemPrompt as string) ?? ''}
                onChange={(e) => handleChange('systemPrompt', e.target.value)}
                placeholder={t('workflow.systemPrompt')}
              />
            </div>

            <div>
              <label className='text-xs font-medium text-muted-foreground'>Temperature</label>
              <input
                type='range'
                className='w-full mt-1'
                min='0'
                max='2'
                step='0.1'
                value={(config.temperature as number) ?? 0.7}
                onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
              />
              <span className='text-xs text-muted-foreground'>
                {(config.temperature as number) ?? 0.7}
              </span>
            </div>
          </>
        )}

        {selectedNode.type === 'tool' && (
          <>
            <div>
              <label className='text-xs font-medium text-muted-foreground'>{t('workflow.tool')}</label>
              <Select
                value={(config.toolName as string) ?? ''}
                onValueChange={(value) => handleChange('toolName', value)}
              >
                <SelectTrigger className='w-full mt-1'>
                  <SelectValue placeholder={t('workflow.selectTool')} />
                </SelectTrigger>
                <SelectContent>
                  {tools.map((tool) => (
                    <SelectItem key={tool.name} value={tool.name}>
                      {tool.name} - {tool.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {selectedNode.type === 'condition' && (
          <div>
            <label className='text-xs font-medium text-muted-foreground'>{t('workflow.condition')}</label>
            <textarea
              className='w-full mt-1 rounded-md border bg-background px-3 py-2 text-sm font-mono min-h-[80px]'
              value={(config.expression as string) ?? ''}
              onChange={(e) => handleChange('expression', e.target.value)}
              placeholder='$input !== null'
            />
            <p className='text-xs text-muted-foreground mt-1'>
              {t('workflow.conditionHint')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
