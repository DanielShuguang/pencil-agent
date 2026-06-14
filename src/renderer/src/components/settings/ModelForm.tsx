import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ModelConfig } from '@shared/ipc'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

interface ModelFormProps {
  model?: ModelConfig
  providerId: string
  onSave: (model: ModelConfig) => void
  onCancel: () => void
}

export function ModelForm({ model, providerId, onSave, onCancel }: ModelFormProps) {
  const [id, setId] = useState(model?.id || '')
  const [name, setName] = useState(model?.name || '')
  const [maxTokens, setMaxTokens] = useState(model?.maxTokens?.toString() || '')
  const [temperature, setTemperature] = useState(model?.temperature?.toString() || '')
  const [maxTokensError, setMaxTokensError] = useState('')
  const [temperatureError, setTemperatureError] = useState('')
  const { t } = useTranslation()

  const handleMaxTokensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMaxTokens(value)
    if (value) {
      const parsed = parseInt(value)
      if (isNaN(parsed) || parsed < 1 || parsed > 1000000) {
        setMaxTokensError(t('settings.maxTokensRange'))
      } else {
        setMaxTokensError('')
      }
    } else {
      setMaxTokensError('')
    }
  }

  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setTemperature(value)
    if (value) {
      const parsed = parseFloat(value)
      if (isNaN(parsed) || parsed < 0 || parsed > 2) {
        setTemperatureError(t('settings.temperatureRange'))
      } else {
        setTemperatureError('')
      }
    } else {
      setTemperatureError('')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsedMaxTokens = maxTokens ? parseInt(maxTokens) : undefined
    const parsedTemperature = temperature ? parseFloat(temperature) : undefined

    if (parsedMaxTokens !== undefined && (parsedMaxTokens < 1 || parsedMaxTokens > 1000000)) {
      return
    }
    if (parsedTemperature !== undefined && (parsedTemperature < 0 || parsedTemperature > 2)) {
      return
    }

    onSave({
      id,
      name,
      providerId,
      maxTokens: parsedMaxTokens,
      temperature: parsedTemperature,
    })
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='model-id'>{t('settings.modelId')}</Label>
        <Input
          id='model-id'
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder='gpt-4o'
          required
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='model-name'>{t('settings.modelName')}</Label>
        <Input
          id='model-name'
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='GPT-4o'
          required
        />
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='max-tokens'>{t('settings.maxTokens')}</Label>
          <Input
            id='max-tokens'
            type='number'
            value={maxTokens}
            onChange={handleMaxTokensChange}
            placeholder='4096'
            aria-invalid={Boolean(maxTokensError)}
          />
          {maxTokensError && <p className='text-sm text-destructive'>{maxTokensError}</p>}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='temperature'>{t('settings.temperature')}</Label>
          <Input
            id='temperature'
            type='number'
            step='0.1'
            min='0'
            max='2'
            value={temperature}
            onChange={handleTemperatureChange}
            placeholder='0.7'
            aria-invalid={Boolean(temperatureError)}
          />
          {temperatureError && <p className='text-sm text-destructive'>{temperatureError}</p>}
        </div>
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
