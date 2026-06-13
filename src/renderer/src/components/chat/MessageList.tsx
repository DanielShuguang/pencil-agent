import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAgentStore } from '../../stores/agent-store'
import { MessageBubble } from './MessageBubble'
import { ScrollArea } from '../ui/scroll-area'
import { useListAnimate } from '../../hooks/useAutoAnimate'

export function MessageList() {
  const { activeSessionId, sessions, createBranch } = useAgentStore()
  const messages = activeSessionId ? sessions.get(activeSessionId) || [] : []
  const scrollRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()
  const [listRef] = useListAnimate()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleRewind = (messageId: string) => {
    createBranch(messageId)
  }

  return (
    <ScrollArea className='flex-1 p-4'>
      <div ref={scrollRef}>
        <div ref={listRef} className='flex flex-col gap-3'>
          {messages.length === 0 ? (
            <div className='flex h-full items-center justify-center text-muted-foreground'>
              <p>{t('chat.startConversation')}</p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} onRewind={handleRewind} />
            ))
          )}
        </div>
      </div>
    </ScrollArea>
  )
}
