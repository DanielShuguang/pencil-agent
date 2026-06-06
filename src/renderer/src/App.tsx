import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AppShell } from './components/layout/AppShell'
import { ChatPanel } from './components/chat/ChatPanel'
import { useAgentStore } from './stores/agent-store'
import { useStatusStore } from './stores/status-store'
import { useThemeStore } from './stores/theme-store'
import { applyTheme } from './themes/apply-theme'
import { Button } from './components/ui/button'
import { TooltipProvider } from './components/ui/tooltip'

function App(): React.JSX.Element {
  const { activeSessionId, createSession, initFromStorage, syncModelWithProviders } = useAgentStore()
  const { init: initStatusStore } = useStatusStore()
  const { initFromStorage: initTheme, currentTheme } = useThemeStore()
  const { t } = useTranslation()

  useEffect(() => {
    initFromStorage()
    initStatusStore()
    initTheme()
    syncModelWithProviders()
  }, [initFromStorage, initStatusStore, initTheme, syncModelWithProviders])

  useEffect(() => {
    applyTheme(currentTheme)
  }, [currentTheme])

  useEffect(() => {
    if (!window.api?.theme) return
    const unsubscribe = window.api.theme.onThemeChanged((state) => {
      const { setDark, setThemeMode } = useThemeStore.getState()
      setThemeMode(state.mode)
      setDark(state.isDark)
    })
    return unsubscribe
  }, [])

  const handleNewSession = async () => {
    await createSession()
  }

  return (
    <TooltipProvider>
      <AppShell>
        {!activeSessionId ? (
          <div className='flex h-full flex-col items-center justify-center gap-4'>
            <h1 className='text-2xl font-bold'>Pencil Agent</h1>
            <p className='text-muted-foreground'>{t('app.startNewConversation')}</p>
            <Button onClick={handleNewSession}>{t('sidebar.newSession')}</Button>
          </div>
        ) : (
          <ChatPanel />
        )}
      </AppShell>
    </TooltipProvider>
  )
}

export default App
