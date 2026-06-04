import { useEffect } from 'react'
import { Bot, Coins, Wifi, WifiOff, Loader2, Info } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useStatusStore } from '../../stores/status-store'
import { useAgentStore } from '../../stores/agent-store'
import { ModelSelector } from '../chat/ModelSelector'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { UpdateNotification } from '../settings/UpdateNotification'

export function StatusBar() {
  const {
    currentModel,
    tokenUsage,
    connectionStatus,
    version,
    isGenerating,
    checkConnection,
    syncFromAgentStore,
  } = useStatusStore()

  const { currentModel: agentModel, isGenerating: agentIsGenerating } = useAgentStore()

  useEffect(() => {
    syncFromAgentStore(agentModel, agentIsGenerating)
  }, [agentModel, agentIsGenerating, syncFromAgentStore])

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className='h-3 w-3 text-green-500' />
      case 'disconnected':
        return <WifiOff className='h-3 w-3 text-red-500' />
      case 'checking':
        return <Loader2 className='h-3 w-3 text-yellow-500 animate-spin' />
    }
  }

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return '已连接'
      case 'disconnected':
        return '已断开'
      case 'checking':
        return '检查中...'
    }
  }

  const formatTokenCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  return (
    <footer className='flex h-6 shrink-0 items-center justify-between border-t border-border bg-muted/50 px-4 text-xs text-muted-foreground'>
      <div className='flex items-center gap-4'>
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-1.5 hover:text-foreground transition-colors',
                isGenerating && 'text-primary',
              )}
            >
              <Bot className='h-3 w-3' />
              <span>{currentModel.id}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent side='top' align='start' className='w-auto p-0'>
            <ModelSelector showTrigger={false} />
          </PopoverContent>
        </Popover>

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
              <span className='font-medium'>Token 用量</span>
            </div>
            <div className='space-y-1'>
              <div className='flex justify-between gap-4'>
                <span>提示：</span>
                <span>{formatTokenCount(tokenUsage.prompt)}</span>
              </div>
              <div className='flex justify-between gap-4'>
                <span>补全：</span>
                <span>{formatTokenCount(tokenUsage.completion)}</span>
              </div>
              <div className='flex justify-between gap-4 border-t pt-1'>
                <span>总计：</span>
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
          {getConnectionIcon()}
          <span>{getConnectionText()}</span>
        </button>

        <span>v{version}</span>
      </div>
    </footer>
  )
}
