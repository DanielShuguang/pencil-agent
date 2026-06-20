import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AppShell } from './components/layout/AppShell'
import { ChatPanel } from './components/chat/ChatPanel'
import { ErrorBoundary } from './components/ui/error-boundary'
import { useAgentStore } from './stores/agent-store'
import { useStatusStore } from './stores/status-store'
import { useThemeStore } from './stores/theme-store'
import { applyTheme } from './themes/apply-theme'
import { Button } from './components/ui/button'
import { TooltipProvider } from './components/ui/tooltip'
import { useNewSession } from './hooks/useNewSession'

function App(): React.JSX.Element {
  const { activeSessionId, initFromStorage, syncModelWithProviders } = useAgentStore()
  const { init: initStatusStore } = useStatusStore()
  const { initFromStorage: initTheme, currentTheme } = useThemeStore()
  const { t } = useTranslation()
  const handleNewSession = useNewSession()

  useEffect(() => {
    initFromStorage()
    void initStatusStore()
    void initTheme()
    void syncModelWithProviders()
  }, [initFromStorage, initStatusStore, initTheme, syncModelWithProviders])

  useEffect(() => {
    applyTheme(currentTheme)
  }, [currentTheme])

  useEffect(() => {
    const savedFont = localStorage.getItem('pencil-agent:font-family')
    if (savedFont) {
      document.documentElement.style.setProperty('--font-family', savedFont)
    }
  }, [])

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('[Global Error]', event.error)
      event.preventDefault()
    }
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('[Unhandled Rejection]', event.reason)
      event.preventDefault()
    }
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  useEffect(() => {
    if (!window.api?.theme) return
    const unsubscribe = window.api.theme.onThemeChanged((state) => {
      useThemeStore.getState().applyFromMain(state)
    })
    return unsubscribe
  }, [])

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  )
}

export default App
