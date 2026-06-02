import { useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

interface InputBarProps {
  onSend: (content: string) => void
  onStop: () => void
  isGenerating: boolean
  disabled: boolean
}

export function InputBar({ onSend, onStop, isGenerating, disabled }: InputBarProps) {
  const [value, setValue] = useState('')
  const { t } = useTranslation()

  const handleSend = () => {
    const trimmed = value.trim()
    if (trimmed && !isGenerating) {
      onSend(trimmed)
      setValue('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className='border-t border-border p-4'>
      <div className='flex gap-2'>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('chat.inputPlaceholder')}
          disabled={disabled || isGenerating}
          className='flex-1'
        />
        {isGenerating ? (
          <Button onClick={onStop} variant='destructive'>
            {t('chat.stop')}
          </Button>
        ) : (
          <Button onClick={handleSend} disabled={disabled || !value.trim()}>
            {t('chat.send')}
          </Button>
        )}
      </div>
    </div>
  )
}
