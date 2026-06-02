import { useState, useRef, useEffect } from 'react'
import { Bot, Coins, Wifi, WifiOff, Loader2, Info } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useStatusStore } from '../../stores/status-store'
import { useAgentStore } from '../../stores/agent-store'
import { ModelSelector } from '../chat/ModelSelector'

export function StatusBar() {
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [showTokenDetails, setShowTokenDetails] = useState(false)
  const modelRef = useRef<HTMLDivElement>(null)
  const tokenRef = useRef<HTMLDivElement>(null)

  const { currentModel, tokenUsage, connectionStatus, version, isGenerating, checkConnection, syncFromAgentStore } =
    useStatusStore()

  const { currentModel: agentModel, isGenerating: agentIsGenerating } = useAgentStore()

  useEffect(() => {
    syncFromAgentStore(agentModel, agentIsGenerating)
  }, [agentModel, agentIsGenerating, syncFromAgentStore])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setShowModelSelector(false)
      }
      if (tokenRef.current && !tokenRef.current.contains(e.target as Node)) {
        setShowTokenDetails(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
        return 'Connected'
      case 'disconnected':
        return 'Disconnected'
      case 'checking':
        return 'Checking...'
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
        <div ref={modelRef} className='relative'>
          <button
            onClick={() => setShowModelSelector(!showModelSelector)}
            className={cn(
              'flex items-center gap-1.5 hover:text-foreground transition-colors',
              isGenerating && 'text-primary',
            )}
          >
            <Bot className='h-3 w-3' />
            <span>{currentModel.id}</span>
          </button>
          {showModelSelector && (
            <div className='absolute bottom-full left-0 mb-1'>
              <ModelSelector onClose={() => setShowModelSelector(false)} />
            </div>
          )}
        </div>

        <div ref={tokenRef} className='relative'>
          <button
            onClick={() => setShowTokenDetails(!showTokenDetails)}
            className='flex items-center gap-1.5 hover:text-foreground transition-colors'
          >
            <Coins className='h-3 w-3' />
            <span>{formatTokenCount(tokenUsage.total)}</span>
          </button>
          {showTokenDetails && (
            <div className='absolute bottom-full left-0 mb-1 rounded-md border bg-popover p-2 shadow-md'>
              <div className='flex items-center gap-1.5 mb-1'>
                <Info className='h-3 w-3' />
                <span className='font-medium'>Token Usage</span>
              </div>
              <div className='space-y-1'>
                <div className='flex justify-between gap-4'>
                  <span>Prompt:</span>
                  <span>{formatTokenCount(tokenUsage.prompt)}</span>
                </div>
                <div className='flex justify-between gap-4'>
                  <span>Completion:</span>
                  <span>{formatTokenCount(tokenUsage.completion)}</span>
                </div>
                <div className='flex justify-between gap-4 border-t pt-1'>
                  <span>Total:</span>
                  <span>{formatTokenCount(tokenUsage.total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className='flex items-center gap-4'>
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
