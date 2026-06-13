import { useEffect, useState } from 'react'
import { Coins } from 'lucide-react'
import type { TokenUsage } from '@shared/ipc'

export function TokenUsageBadge() {
  const [usage, setUsage] = useState<TokenUsage | null>(null)

  useEffect(() => {
    const handler = (e: CustomEvent<Partial<TokenUsage>>) => {
      setUsage((prev) => ({
        prompt: e.detail.prompt ?? prev?.prompt ?? 0,
        completion: e.detail.completion ?? prev?.completion ?? 0,
        total: (e.detail.prompt ?? prev?.prompt ?? 0) + (e.detail.completion ?? prev?.completion ?? 0),
      }))
    }
    window.addEventListener('token-usage', handler as EventListener)
    return () => window.removeEventListener('token-usage', handler as EventListener)
  }, [])

  if (!usage || usage.total === 0) return null

  const formatTokens = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
    return String(n)
  }

  return (
    <div className='flex items-center gap-1 text-xs text-muted-foreground'>
      <Coins className='h-3 w-3' />
      <span>{formatTokens(usage.total)}</span>
    </div>
  )
}
