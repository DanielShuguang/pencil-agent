import { useAgentStore } from '../../stores/agent-store'
import { MessageList } from './MessageList'
import { InputBar } from './InputBar'

export function ChatPanel() {
  const { activeSessionId, isGenerating, stopGeneration } = useAgentStore()

  return (
    <div className='flex h-full flex-col'>
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
