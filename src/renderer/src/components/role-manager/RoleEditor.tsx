import { useState } from 'react'
import type { AgentRole } from '@shared/ipc'

interface RoleEditorProps {
  role?: AgentRole | null
  onSave: (role: Omit<AgentRole, 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic' },
]

const MODELS: Record<string, { id: string; name: string }[]> = {
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
  ],
  anthropic: [
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
  ],
}

const AVAILABLE_TOOLS = ['read', 'write', 'edit', 'bash']

export function RoleEditor({ role, onSave, onCancel }: RoleEditorProps) {
  const [name, setName] = useState(role?.name || '')
  const [description, setDescription] = useState(role?.description || '')
  const [systemPrompt, setSystemPrompt] = useState(role?.systemPrompt || '')
  const [provider, setProvider] = useState(role?.model.provider || 'anthropic')
  const [modelId, setModelId] = useState(role?.model.id || 'claude-sonnet-4-20250514')
  const [tools, setTools] = useState<string[]>(role?.tools || ['read', 'write', 'bash'])

  const handleSave = () => {
    if (!name.trim() || !systemPrompt.trim()) return

    onSave({
      id: role?.id || name.toLowerCase().replace(/\s+/g, '-'),
      name: name.trim(),
      description: description.trim(),
      systemPrompt: systemPrompt.trim(),
      model: { id: modelId, provider },
      tools,
    })
  }

  const toggleTool = (tool: string) => {
    setTools((prev) => (prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]))
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <label className="text-sm font-medium">名称</label>
        <input
          type="text"
          className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-background"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：研究员"
        />
      </div>

      <div>
        <label className="text-sm font-medium">描述</label>
        <input
          type="text"
          className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-background"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="例如：负责研究任务"
        />
      </div>

      <div>
        <label className="text-sm font-medium">系统提示词</label>
        <textarea
          className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-background min-h-[100px]"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="定义角色的行为和能力..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">供应商</label>
          <select
            className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-background"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">模型</label>
          <select
            className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-background"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
          >
            {MODELS[provider]?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">工具</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {AVAILABLE_TOOLS.map((tool) => (
            <button
              key={tool}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                tools.includes(tool) ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'
              }`}
              onClick={() => toggleTool(tool)}
            >
              {tool}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button
          className="px-4 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
          onClick={onCancel}
        >
          取消
        </button>
        <button
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          onClick={handleSave}
          disabled={!name.trim() || !systemPrompt.trim()}
        >
          {role ? '更新' : '创建'}
        </button>
      </div>
    </div>
  )
}
