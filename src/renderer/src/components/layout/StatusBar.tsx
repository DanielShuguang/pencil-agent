import { Coins, Wifi, WifiOff, Loader2, Info, Folder } from 'lucide-react'
import { match } from 'ts-pattern'
import { useStatusStore } from '../../stores/status-store'
import { useAgentStore } from '../../stores/agent-store'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { UpdateNotification } from '../settings/UpdateNotification'
import { useTranslation } from 'react-i18next'

export function StatusBar() {
  const { tokenUsage, connectionStatus, version, checkConnection } = useStatusStore()

  const { activeSessionId, sessionMetas } = useAgentStore()
  const { t } = useTranslation()

  const activeCwd = activeSessionId ? sessionMetas.get(activeSessionId)?.cwd : undefined

  const connectionInfo = match(connectionStatus)
    .with('connected', () => ({ icon: <Wifi className='h-3 w-3 text-green-500' />, text: t('status.connected') }))
    .with('disconnected', () => ({ icon: <WifiOff className='h-3 w-3 text-red-500' />, text: t('status.disconnected') }))
    .with('checking', () => ({ icon: <Loader2 className='h-3 w-3 text-yellow-500 animate-spin' />, text: t('status.checking') }))
    .exhaustive()

  const formatTokenCount = (count: number) =>
    match(count)
      .when((c) => c >= 1000000, (c) => `${(c / 1000000).toFixed(1)}M`)
      .when((c) => c >= 1000, (c) => `${(c / 1000).toFixed(1)}K`)
      .otherwise((c) => c.toString())

  return (
    <footer className='flex h-6 shrink-0 items-center justify-between border-t border-border bg-muted/50 px-4 text-xs text-muted-foreground'>
      <div className='flex items-center gap-4'>
        {activeCwd && (
          <span className='flex items-center gap-1' title={activeCwd}>
            <Folder className='h-3 w-3' />
            <span className='max-w-[200px] truncate'>{activeCwd}</span>
          </span>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <button className='flex items-center gap-1.5 hover:text-foreground transition-colors'>
              <Coins className='h-3 w-3' />
              <span>{formatTokenCount(tokenUsage.total)}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent side='top' align='start' className='w-48'>
            <div className='flex items-center gap-1.5 mb-2'>
              <Info className='h-3 w-3' />
              <span className='font-medium'>{t('status.tokenUsage')}</span>
            </div>
            <div className='space-y-1'>
              <div className='flex justify-between gap-4'>
                <span>{t('status.prompt')}</span>
                <span>{formatTokenCount(tokenUsage.prompt)}</span>
              </div>
              <div className='flex justify-between gap-4'>
                <span>{t('status.completion')}</span>
                <span>{formatTokenCount(tokenUsage.completion)}</span>
              </div>
              <div className='flex justify-between gap-4 border-t pt-1'>
                <span>{t('status.total')}</span>
                <span>{formatTokenCount(tokenUsage.total)}</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className='flex items-center gap-4'>
        <UpdateNotification />
        <button
          onClick={() => checkConnection()}
          className='flex items-center gap-1.5 hover:text-foreground transition-colors'
        >
          {connectionInfo.icon}
          <span>{connectionInfo.text}</span>
        </button>

        <span>v{version}</span>
      </div>
    </footer>
  )
}
