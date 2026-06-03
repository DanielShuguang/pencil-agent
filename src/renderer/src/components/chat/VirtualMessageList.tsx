import { useCallback, useEffect, useRef, useMemo } from 'react'
import { VariableSizeList as List } from 'react-window'
import { useTranslation } from 'react-i18next'
import { useAgentStore } from '../../stores/agent-store'
import { MessageBubble } from './MessageBubble'

const ITEM_SIZE = 80
const OVERSCAN_COUNT = 5

export function VirtualMessageList() {
  const { activeSessionId, sessions } = useAgentStore()
  const messages = activeSessionId ? sessions.get(activeSessionId) || [] : []
  const listRef = useRef<List>(null)
  const heightCache = useRef<Map<string, number>>(new Map())
  const { t } = useTranslation()

  const getItemSize = useCallback(
    (index: number) => {
      const message = messages[index]
      if (!message) return ITEM_SIZE

      const cached = heightCache.current.get(message.id)
      if (cached) return cached

      const hasToolCall = !!message.toolCall
      const lineCount = message.content.split('\n').length
      const estimatedHeight = Math.max(
        ITEM_SIZE,
        lineCount * 20 + (hasToolCall ? 100 : 0) + 32,
      )

      heightCache.current.set(message.id, estimatedHeight)
      return estimatedHeight
    },
    [messages],
  )

  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const message = messages[index]
      if (!message) return null

      return (
        <div style={style} className='px-4 py-2'>
          <MessageBubble message={message} />
        </div>
      )
    },
    [messages],
  )

  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(messages.length - 1, 'end')
    }
  }, [messages])

  const itemCount = useMemo(() => messages.length, [messages])

  if (itemCount === 0) {
    return (
      <div className='flex h-full items-center justify-center text-muted-foreground'>
        <p>{t('chat.startConversation')}</p>
      </div>
    )
  }

  return (
    <List
      ref={listRef}
      height={600}
      itemCount={itemCount}
      itemSize={getItemSize}
      overscanCount={OVERSCAN_COUNT}
      width='100%'
    >
      {Row}
    </List>
  )
}
