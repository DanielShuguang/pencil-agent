import { useEffect } from 'react'
import { List, useDynamicRowHeight, useListRef, type RowComponentProps } from 'react-window'
import { useTranslation } from 'react-i18next'
import { useAgentStore, type Message } from '../../stores/agent-store'
import { MessageBubble } from './MessageBubble'

type RowProps = {
  messages: Message[]
  onRewind: (messageId: string) => void
}

function RowComponent({ index, messages, onRewind, style }: RowComponentProps<RowProps>) {
  const message = messages[index]
  if (!message) return null

  return (
    <div style={style} className='px-4 py-2'>
      <MessageBubble message={message} onRewind={onRewind} />
    </div>
  )
}

export function VirtualMessageList() {
  const { activeSessionId, sessions, createBranch } = useAgentStore()
  const messages = activeSessionId ? sessions.get(activeSessionId) || [] : []
  const { t } = useTranslation()
  const listRef = useListRef(null)

  const rowHeight = useDynamicRowHeight({ defaultRowHeight: 80, key: activeSessionId || 'empty' })

  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToRow({ index: messages.length - 1, align: 'end' })
    }
  }, [messages, listRef])

  const handleRewind = (messageId: string) => {
    void createBranch(messageId)
  }

  if (messages.length === 0) {
    return (
      <div className='flex h-full items-center justify-center text-muted-foreground'>
        <p>{t('chat.startConversation')}</p>
      </div>
    )
  }

  return (
    <div style={{ height: 600 }}>
      <List
        listRef={listRef}
        rowComponent={RowComponent}
        rowCount={messages.length}
        rowHeight={rowHeight}
        rowProps={{ messages, onRewind: handleRewind }}
        overscanCount={5}
        style={{ height: 600 }}
      />
    </div>
  )
}
