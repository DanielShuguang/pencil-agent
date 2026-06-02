import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AgentRole } from '@shared/ipc'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

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
  const { t } = useTranslation()

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
        <label className="text-sm font-medium">{t('role.name')}</label>
        <input
          type="text"
          className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-background"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('role.namePlaceholder')}
        />
      </div>

      <div>
        <label className="text-sm font-medium">{t('role.description')}</label>
        <input
          type="text"
          className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-background"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('role.descriptionPlaceholder')}
        />
      </div>

      <div>
        <label className="text-sm font-medium">{t('role.systemPrompt')}</label>
        <textarea
          className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-background min-h-[100px]"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder={t('role.systemPromptPlaceholder')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">{t('settings.providerName')}</label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger className="w-full mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROVIDERS.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">{t('workflow.model')}</label>
          <Select value={modelId} onValueChange={setModelId}>
            <SelectTrigger className="w-full mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODELS[provider]?.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">{t('workflow.tool')}</label>
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
          {t('common.cancel')}
        </button>
        <button
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          onClick={handleSave}
          disabled={!name.trim() || !systemPrompt.trim()}
        >
          {role ? t('common.edit') : t('common.create')}
        </button>
      </div>
    </div>
  )
}
