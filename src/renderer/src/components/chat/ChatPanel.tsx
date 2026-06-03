import { useMemo } from 'react'
import { useAgentStore } from '../../stores/agent-store'
import { MessageList } from './MessageList'
import { VirtualMessageList } from './VirtualMessageList'
import { InputBar } from './InputBar'
import { ModelSelector } from './ModelSelector'
import { BranchSelector } from './BranchSelector'

const VIRTUAL_SCROLL_THRESHOLD = 50

export function ChatPanel() {
  const { activeSessionId, isGenerating, stopGeneration, sessionMetas, sessions } = useAgentStore()
  const activeMeta = activeSessionId ? sessionMetas.get(activeSessionId) : null
  const messages = activeSessionId ? sessions.get(activeSessionId) || [] : []

  const shouldUseVirtualScroll = useMemo(() => messages.length > VIRTUAL_SCROLL_THRESHOLD, [messages.length])

  return (
    <div className='flex h-full flex-col'>
      <div className='flex items-center justify-between px-4 py-2 border-b'>
        <div className='flex items-center gap-2'>
          <div className='text-sm font-medium truncate'>
            {activeMeta?.title || 'Pencil Agent'}
          </div>
          <BranchSelector />
        </div>
        <ModelSelector />
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
