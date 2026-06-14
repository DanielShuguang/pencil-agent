import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '../../stores/settings-store'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', placeholder: 'sk-...' },
  { id: 'anthropic', name: 'Anthropic', placeholder: 'sk-ant-...' },
]

export function ApiKeyForm() {
  const { loadApiKey, saveApiKey, deleteApiKey } = useSettingsStore()
  const [keys, setKeys] = useState<Record<string, string>>({})
  const [savedKeys, setSavedKeys] = useState<Record<string, boolean>>({})
  const [maskedKeys, setMaskedKeys] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const { t } = useTranslation()

  useEffect(() => {
    for (const provider of PROVIDERS) {
      loadApiKey(provider.id).then((key) => {
        if (key) {
          setSavedKeys((prev) => ({ ...prev, [provider.id]: true }))
          window.api.settings.getMaskedKey(provider.id).then((maskedKey) => {
            if (maskedKey) {
              setMaskedKeys((prev) => ({ ...prev, [provider.id]: maskedKey }))
            }
          })
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
      const maskedKey = await window.api.settings.getMaskedKey(provider)
      if (maskedKey) {
        setMaskedKeys((prev) => ({ ...prev, [provider]: maskedKey }))
      }
    } catch (error) {
      console.error('Failed to save API key:', error)
    } finally {
      setSaving(null)
    }
  }

  const handleDelete = useCallback((provider: string) => {
    setDeleteConfirm(provider)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirm) return
    try {
      await deleteApiKey(deleteConfirm)
      setSavedKeys((prev) => ({ ...prev, [deleteConfirm]: false }))
    } catch (error) {
      console.error('Failed to delete API key:', error)
    } finally {
      setDeleteConfirm(null)
    }
  }, [deleteConfirm, deleteApiKey])

  return (
    <div className='space-y-4'>
      <h3 className='text-sm font-medium'>{t('settings.apiKeys')}</h3>
      {PROVIDERS.map((provider) => (
        <div key={provider.id} className='space-y-2'>
          <label className='text-sm text-muted-foreground'>{provider.name}</label>
          {savedKeys[provider.id] ? (
            <div className='flex items-center gap-2'>
              <span className='text-sm text-muted-foreground font-mono'>
                {maskedKeys[provider.id] || t('common.saved')}
              </span>
              <button
                className='text-xs text-destructive hover:underline'
                onClick={() => handleDelete(provider.id)}
              >
                {t('common.delete')}
              </button>
            </div>
          ) : (
            <div className='flex gap-2'>
              <input
                type='password'
                className='flex-1 px-3 py-1.5 text-sm border rounded-md bg-background'
                placeholder={provider.placeholder}
                value={keys[provider.id] || ''}
                onChange={(e) => setKeys((prev) => ({ ...prev, [provider.id]: e.target.value }))}
              />
              <button
                className='px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50'
                onClick={() => handleSave(provider.id)}
                disabled={!keys[provider.id] || saving === provider.id}
              >
                {saving === provider.id ? t('common.saving') : t('common.save')}
              </button>
            </div>
          )}
        </div>
      ))}

      <AlertDialog open={Boolean(deleteConfirm)} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirm')}</AlertDialogTitle>
            <AlertDialogDescription>{t('settings.deleteApiKeyConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{t('common.ok')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
