import { useMemo, useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Folder, Download } from 'lucide-react'
import { useAgentStore } from '../../stores/agent-store'
import { MessageList } from './MessageList'
import { VirtualMessageList } from './VirtualMessageList'
import { InputBar } from './InputBar'
import { ModelSelector } from './ModelSelector'
import { BranchSelector } from './BranchSelector'
import { TokenUsageBadge } from './TokenUsageBadge'
import { exportAsMarkdown, exportAsJSON } from '../../lib/export-chat'
import { toast } from '../../lib/toast'

const VIRTUAL_SCROLL_THRESHOLD = 50

export function ChatPanel() {
  const { activeSessionId, isGenerating, stopGeneration, sessionMetas, sessions } = useAgentStore()
  const activeMeta = activeSessionId ? sessionMetas.get(activeSessionId) : null
  const messages = activeSessionId ? sessions.get(activeSessionId) || [] : []
  const { t } = useTranslation()
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  const shouldUseVirtualScroll = useMemo(
    () => messages.length > VIRTUAL_SCROLL_THRESHOLD,
    [messages.length],
  )

  useEffect(() => {
    if (!exportOpen) return
    const handleClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [exportOpen])

  const handleExport = (format: 'md' | 'json') => {
    if (!messages.length) return
    const title = activeMeta?.title || 'chat'
    if (format === 'md') exportAsMarkdown(messages, title)
    else exportAsJSON(messages, title)
    toast.success(t('chat.chatExported'))
    setExportOpen(false)
  }

  return (
    <div className='flex h-full flex-col'>
      <div className='flex items-center justify-between px-4 py-2 border-b'>
        <div className='flex items-center gap-2 min-w-0'>
          <div className='text-sm font-medium truncate'>{activeMeta?.title || 'Pencil Agent'}</div>
          {activeMeta?.cwd && (
            <span className='flex items-center gap-1 text-xs text-muted-foreground' title={activeMeta.cwd}>
              <Folder className='h-3 w-3 shrink-0' />
              <span className='max-w-[150px] truncate'>{activeMeta.cwd}</span>
            </span>
          )}
          <BranchSelector />
        </div>
        <div className='flex items-center gap-2'>
          {messages.length > 0 && (
            <div className='relative' ref={exportRef}>
              <button
                onClick={() => setExportOpen(!exportOpen)}
                className='p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors'
                title={t('chat.exportChat')}
              >
                <Download className='h-4 w-4' />
              </button>
              {exportOpen && (
                <div className='absolute right-0 top-full mt-1 bg-popover border rounded-md shadow-md py-1 z-50 min-w-[140px]'>
                  <button
                    onClick={() => handleExport('md')}
                    className='w-full px-3 py-1.5 text-sm text-left hover:bg-accent transition-colors'
                  >
                    {t('chat.exportMarkdown')}
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className='w-full px-3 py-1.5 text-sm text-left hover:bg-accent transition-colors'
                  >
                    {t('chat.exportJSON')}
                  </button>
                </div>
              )}
            </div>
          )}
          <ModelSelector mode='session' />
          <TokenUsageBadge />
        </div>
      </div>
      {shouldUseVirtualScroll ? <VirtualMessageList /> : <MessageList />}
      <InputBar
        onSend={(content) => {
          useAgentStore.getState().sendMessage(content)
        }}
        onStop={stopGeneration}
        isGenerating={isGenerating}
        disabled={!activeSessionId}
      />
    </div>
  )
}
