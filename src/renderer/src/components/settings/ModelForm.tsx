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
  const { t } = useTranslation()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      id,
      name,
      providerId,
      maxTokens: maxTokens ? parseInt(maxTokens) : undefined,
      temperature: temperature ? parseFloat(temperature) : undefined,
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
            onChange={(e) => setMaxTokens(e.target.value)}
            placeholder='4096'
          />
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
            onChange={(e) => setTemperature(e.target.value)}
            placeholder='0.7'
          />
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
