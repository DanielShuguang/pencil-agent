import { useEffect, useRef, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import { useAgentStore } from '../../stores/agent-store'
import { MessageBubble } from './MessageBubble'
import { ScrollArea } from '../ui/scroll-area'
import { Button } from '../ui/button'

export function MessageList() {
  const { activeSessionId, sessions, createBranch } = useAgentStore()
  const messages = activeSessionId ? sessions.get(activeSessionId) || [] : []
  const scrollRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()
  const [showScrollButton, setShowScrollButton] = useState(false)

  // 检查是否在底部
  const isAtBottom = useCallback(() => {
    if (!scrollRef.current) return true
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    return scrollHeight - scrollTop - clientHeight < 50
  }, [])

  // 滚动到底部的函数
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

  // 监听滚动事件
  useEffect(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement) return

    const handleScroll = () => {
      setShowScrollButton(!isAtBottom())
    }

    scrollElement.addEventListener('scroll', handleScroll)
    return () => scrollElement.removeEventListener('scroll', handleScroll)
  }, [isAtBottom])

  // 消息变化时滚动到底部
  useEffect(() => {
    if (isAtBottom() || messages.length <= 1) {
      scrollToBottom()
    }
  }, [messages, scrollToBottom, isAtBottom])

  // 监听消息内容变化（文本追加时）
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'assistant' && lastMessage.content) {
      if (isAtBottom()) {
        requestAnimationFrame(scrollToBottom)
      }
    }
  }, [messages, scrollToBottom, isAtBottom])

  const handleRewind = (messageId: string) => {
    createBranch(messageId)
  }

  return (
    <ScrollArea className='flex-1 p-4 relative'>
      <div ref={scrollRef}>
        <div className='flex flex-col gap-3'>
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
      {showScrollButton && (
        <Button
          variant='outline'
          size='icon'
          className='fixed bottom-24 right-8 h-10 w-10 rounded-full shadow-lg z-50'
          onClick={scrollToBottom}
        >
          <ChevronDown className='h-5 w-5' />
        </Button>
      )}
    </ScrollArea>
  )
}
