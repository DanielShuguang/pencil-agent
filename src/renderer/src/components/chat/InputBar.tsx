import { useState, useRef, useEffect, useCallback, useMemo, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { isCommand, executeCommand, filterCommands, type CommandDef } from '../../lib/commands'
import { useAgentStore } from '../../stores/agent-store'

interface InputBarProps {
  onSend: (content: string) => void
  onStop: () => void
  isGenerating: boolean
  disabled: boolean
}

export function InputBar({ onSend, onStop, isGenerating, disabled }: InputBarProps) {
  const [value, setValue] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()

  const suggestions = useMemo(() => {
    if (!value.startsWith('/')) return []
    return filterCommands(value)
  }, [value])

  const showSuggestions = suggestions.length > 0 && value.startsWith('/')

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

  useEffect(() => {
    setSelectedIndex(0)
  }, [suggestions])

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || isGenerating) return

    if (isCommand(trimmed)) {
      const result = executeCommand(trimmed)
      if (result) {
        const store = useAgentStore.getState()
        const { activeSessionId } = store
        if (activeSessionId) {
          const sessions = new Map(store.sessions)
          const prev = sessions.get(activeSessionId) || []
          sessions.set(activeSessionId, [
            ...prev,
            { id: `cmd-${Date.now()}`, role: 'user' as const, content: trimmed, timestamp: Date.now() },
            { id: `cmd-res-${Date.now()}`, role: 'system' as const, content: result, timestamp: Date.now() },
          ])
          useAgentStore.setState({ sessions })
        }
      }
      setValue('')
    } else {
      onSend(trimmed)
      setValue('')
    }
  }

  const handleSelectSuggestion = (cmd: CommandDef) => {
    setValue(`${cmd.name  } `)
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
        return
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        handleSelectSuggestion(suggestions[selectedIndex])
        return
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className='border-t border-border p-4 relative'>
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className='absolute bottom-full left-4 right-4 mb-1 bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto z-50'
        >
          {suggestions.map((cmd, i) => (
            <button
              key={cmd.name}
              onClick={() => handleSelectSuggestion(cmd)}
              className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                i === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50'
              }`}
            >
              <span className='font-medium'>{cmd.name}</span>
              {cmd.usage && <span className='text-muted-foreground ml-2 text-xs'>{cmd.usage}</span>}
              <span className='text-muted-foreground ml-2 text-xs'>{cmd.description}</span>
            </button>
          ))}
        </div>
      )}
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
