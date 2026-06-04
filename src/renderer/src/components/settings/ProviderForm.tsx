import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ApiFormat, ModelProvider, ModelProviderInfo } from '@shared/ipc'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

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
  const [apiFormat, setApiFormat] = useState<ApiFormat>(provider?.apiFormat || 'openai')
  const [urlError, setUrlError] = useState('')
  const [apiKeyWarning, setApiKeyWarning] = useState('')
  const { t } = useTranslation()

  const validateUrl = (url: string): boolean => {
    if (!url) return true
    try {
      const parsed = new URL(url)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
      return false
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setBaseUrl(value)
    if (value && !validateUrl(value)) {
      setUrlError(t('settings.invalidUrl'))
    } else {
      setUrlError('')
    }
  }

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setApiKey(value)
    if (value) {
      const expectedPrefix = apiFormat === 'openai' ? 'sk-' : 'sk-ant-'
      if (!value.startsWith(expectedPrefix)) {
        setApiKeyWarning(t('settings.apiKeyWarning'))
      } else {
        setApiKeyWarning('')
      }
    } else {
      setApiKeyWarning('')
    }
  }

  const handleApiFormatChange = (value: string) => {
    const newFormat = value as ApiFormat
    setApiFormat(newFormat)
    if (apiKey) {
      const expectedPrefix = newFormat === 'openai' ? 'sk-' : 'sk-ant-'
      if (!apiKey.startsWith(expectedPrefix)) {
        setApiKeyWarning(t('settings.apiKeyWarning'))
      } else {
        setApiKeyWarning('')
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (baseUrl && !validateUrl(baseUrl)) {
      setUrlError(t('settings.invalidUrl'))
      return
    }
    onSave({
      id,
      name,
      baseUrl,
      apiKey,
      apiFormat,
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
        <Label htmlFor='api-format'>{t('settings.apiFormat')}</Label>
        <Select value={apiFormat} onValueChange={handleApiFormatChange}>
          <SelectTrigger id='api-format'>
            <SelectValue placeholder={t('settings.apiFormat')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='openai'>OpenAI</SelectItem>
            <SelectItem value='anthropic'>Anthropic</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='base-url'>{t('settings.baseUrl')}</Label>
        <Input
          id='base-url'
          value={baseUrl}
          onChange={handleUrlChange}
          placeholder='https://api.deepseek.com/v1'
          required
          aria-invalid={Boolean(urlError)}
        />
        {urlError && <p className='text-sm text-destructive'>{urlError}</p>}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='api-key'>{t('settings.apiKey')}</Label>
        <Input
          id='api-key'
          type='password'
          value={apiKey}
          onChange={handleApiKeyChange}
          placeholder={apiFormat === 'openai' ? 'sk-...' : 'sk-ant-...'}
          required
        />
        {apiKeyWarning && (
          <p className='text-sm text-yellow-600 dark:text-yellow-500'>{apiKeyWarning}</p>
        )}
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
