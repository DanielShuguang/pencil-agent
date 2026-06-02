import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ModelProvider, ModelProviderInfo } from '@shared/ipc'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

interface ProviderFormProps {
  provider?: ModelProviderInfo
  onSave: (provider: Omit<ModelProvider, 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}

export function ProviderForm({ provider, onSave, onCancel }: ProviderFormProps) {
  const [id, setId] = useState(provider?.id || '')
  const [name, setName] = useState(provider?.name || '')
  const [baseUrl, setBaseUrl] = useState(provider?.baseUrl || '')
  const [apiKey, setApiKey] = useState('')
  const { t } = useTranslation()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      id,
      name,
      baseUrl,
      apiKey,
      models: provider?.models || [],
    })
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='provider-id'>{t('settings.providerId')}</Label>
        <Input
          id='provider-id'
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder='deepseek'
          required
          disabled={Boolean(provider)}
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='provider-name'>{t('settings.providerName')}</Label>
        <Input
          id='provider-name'
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='DeepSeek'
          required
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='base-url'>{t('settings.baseUrl')}</Label>
        <Input
          id='base-url'
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder='https://api.deepseek.com/v1'
          required
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='api-key'>{t('settings.apiKey')}</Label>
        <Input
          id='api-key'
          type='password'
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder='sk-...'
          required
        />
      </div>

      <div className='flex justify-end gap-2'>
        <Button type='button' variant='outline' onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type='submit'>{t('common.save')}</Button>
      </div>
    </form>
  )
}
