import { useAgentStore } from '../../stores/agent-store'
import { MessageList } from './MessageList'
import { InputBar } from './InputBar'
import { ModelSelector } from './ModelSelector'
import { BranchSelector } from './BranchSelector'

export function ChatPanel() {
  const { activeSessionId, isGenerating, stopGeneration, sessionMetas } = useAgentStore()
  const activeMeta = activeSessionId ? sessionMetas.get(activeSessionId) : null

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
      <MessageList />
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
