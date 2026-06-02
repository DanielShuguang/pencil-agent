import { useState, useEffect } from 'react'
import { useSettingsStore } from '../../stores/settings-store'

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', placeholder: 'sk-...' },
  { id: 'anthropic', name: 'Anthropic', placeholder: 'sk-ant-...' },
]

export function ApiKeyForm() {
  const { loadApiKey, saveApiKey, deleteApiKey } = useSettingsStore()
  const [keys, setKeys] = useState<Record<string, string>>({})
  const [savedKeys, setSavedKeys] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    for (const provider of PROVIDERS) {
      loadApiKey(provider.id).then((key) => {
        if (key) {
          setSavedKeys((prev) => ({ ...prev, [provider.id]: true }))
        }
      })
    }
  }, [])

  const handleSave = async (provider: string) => {
    const key = keys[provider]
    if (!key) return

    setSaving(provider)
    try {
      await saveApiKey(provider, key)
      setSavedKeys((prev) => ({ ...prev, [provider]: true }))
      setKeys((prev) => ({ ...prev, [provider]: '' }))
    } catch (error) {
      console.error('Failed to save API key:', error)
    } finally {
      setSaving(null)
    }
  }

  const handleDelete = async (provider: string) => {
    try {
      await deleteApiKey(provider)
      setSavedKeys((prev) => ({ ...prev, [provider]: false }))
    } catch (error) {
      console.error('Failed to delete API key:', error)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">API 密钥</h3>
      {PROVIDERS.map((provider) => (
        <div key={provider.id} className="space-y-2">
          <label className="text-sm text-muted-foreground">{provider.name}</label>
          {savedKeys[provider.id] ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">密钥已保存</span>
              <button
                className="text-xs text-destructive hover:underline"
                onClick={() => handleDelete(provider.id)}
              >
                删除
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="password"
                className="flex-1 px-3 py-1.5 text-sm border rounded-md bg-background"
                placeholder={provider.placeholder}
                value={keys[provider.id] || ''}
                onChange={(e) => setKeys((prev) => ({ ...prev, [provider.id]: e.target.value }))}
              />
              <button
                className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                onClick={() => handleSave(provider.id)}
                disabled={!keys[provider.id] || saving === provider.id}
              >
                {saving === provider.id ? '保存中...' : '保存'}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
