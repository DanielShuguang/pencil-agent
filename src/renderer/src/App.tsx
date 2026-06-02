import { AppShell } from './components/layout/AppShell'
import { ChatPanel } from './components/chat/ChatPanel'
import { useAgentStore } from './stores/agent-store'
import { Button } from './components/ui/button'

function App(): React.JSX.Element {
  const { activeSessionId, createSession } = useAgentStore()

  const handleNewSession = async () => {
    await createSession()
  }

  return (
    <AppShell>
      {!activeSessionId ? (
        <div className='flex h-full flex-col items-center justify-center gap-4'>
          <h1 className='text-2xl font-bold'>Pencil Agent</h1>
          <p className='text-muted-foreground'>开始一个新的对话</p>
          <Button onClick={handleNewSession}>新建会话</Button>
        </div>
      ) : (
        <ChatPanel />
      )}
    </AppShell>
  )
}

export default App
