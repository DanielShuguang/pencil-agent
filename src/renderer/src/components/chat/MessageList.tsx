import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Search } from 'lucide-react'
import { useAgentStore } from '../../stores/agent-store'
import { MessageBubble } from './MessageBubble'
import { ScrollArea } from '../ui/scroll-area'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

export function MessageList() {
  const { activeSessionId, sessions, createBranch } = useAgentStore()
  const messages = activeSessionId ? sessions.get(activeSessionId) || [] : []
  const scrollRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const filteredMessages = useMemo(
    () =>
      searchQuery
        ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
        : messages,
    [messages, searchQuery],
  )

  const isAtBottom = useCallback(() => {
    if (!scrollRef.current) return true
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    return scrollHeight - scrollTop - clientHeight < 50
  }, [])

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const el = scrollRef.current
      if (typeof el.scrollTo === 'function') {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
      } else {
        el.scrollTop = el.scrollHeight
      }
    }
  }, [])

  useEffect(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement) return

    const handleScroll = () => {
      setShowScrollButton(!isAtBottom())
    }

    scrollElement.addEventListener('scroll', handleScroll)
    return () => scrollElement.removeEventListener('scroll', handleScroll)
  }, [isAtBottom])

  useEffect(() => {
    if (isAtBottom() || messages.length <= 1) {
      scrollToBottom()
    }
  }, [messages, scrollToBottom, isAtBottom])

  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'assistant' && lastMessage.content) {
      if (isAtBottom()) {
        requestAnimationFrame(scrollToBottom)
      }
    }
  }, [messages, scrollToBottom, isAtBottom])

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false)
        setSearchQuery('')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSearchOpen])

  const handleRewind = (messageId: string) => {
    createBranch(messageId)
  }

  return (
    <div className='flex-1 flex flex-col overflow-hidden relative'>
      {isSearchOpen && (
        <div className='flex items-center gap-2 px-4 py-2 border-b bg-muted/30 shrink-0'>
          <Search className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
          <input
            ref={searchInputRef}
            type='text'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('chat.searchMessages')}
            className='flex-1 text-sm bg-transparent outline-none'
          />
          {searchQuery && (
            <span className='text-xs text-muted-foreground shrink-0'>
              {filteredMessages.length}/{messages.length}
            </span>
          )}
          <button
            onClick={() => {
              setIsSearchOpen(false)
              setSearchQuery('')
            }}
            className='text-xs text-muted-foreground hover:text-foreground shrink-0'
          >
            {t('common.close')}
          </button>
        </div>
      )}
      <ScrollArea className='flex-1 p-4'>
        <div ref={scrollRef}>
          <div className='flex flex-col gap-3'>
            {filteredMessages.length === 0 ? (
              <div className='flex h-full items-center justify-center text-muted-foreground'>
                <p>{searchQuery ? t('memory.noResults') : t('chat.startConversation')}</p>
              </div>
            ) : (
              filteredMessages.map((message) => (
                <MessageBubble key={message.id} message={message} onRewind={handleRewind} />
              ))
            )}
          </div>
        </div>
      </ScrollArea>
      {showScrollButton && (
        <Button
          variant='outline'
          size='icon'
          className={cn(
            'fixed bottom-24 right-8 h-10 w-10 rounded-full shadow-lg z-50',
            isSearchOpen && 'bottom-36',
          )}
          onClick={scrollToBottom}
        >
          <ChevronDown className='h-5 w-5' />
        </Button>
      )}
    </div>
  )
}
