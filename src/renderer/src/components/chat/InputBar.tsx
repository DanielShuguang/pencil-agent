import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'

interface InputBarProps {
  onSend: (content: string) => void
  onStop: () => void
  isGenerating: boolean
  disabled: boolean
}

export function InputBar({ onSend, onStop, isGenerating, disabled }: InputBarProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { t } = useTranslation()

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    const maxHeight = 200
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  const handleSend = () => {
    const trimmed = value.trim()
    if (trimmed && !isGenerating) {
      onSend(trimmed)
      setValue('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className='border-t border-border p-4'>
      <div className='flex gap-2 items-end'>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('chat.inputPlaceholder')}
          disabled={disabled || isGenerating}
          className='flex-1 resize-none max-h-[200px]'
          rows={1}
        />
        {isGenerating ? (
          <Button onClick={onStop} variant='destructive' className='shrink-0'>
            {t('chat.stop')}
          </Button>
        ) : (
          <Button onClick={handleSend} disabled={disabled || !value.trim()} className='shrink-0'>
            {t('chat.send')}
          </Button>
        )}
      </div>
    </div>
  )
}
