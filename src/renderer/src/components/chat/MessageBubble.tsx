import { cn } from '../../lib/utils'
import { ToolCallCard } from './ToolCallCard'
import { CodeBlock } from './CodeBlock'

interface ToolCall {
  toolName: string
  parameters: Record<string, unknown>
  status: 'pending' | 'running' | 'success' | 'error'
  result?: unknown
  error?: string
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  toolCall?: ToolCall
  timestamp: number
}

interface MessageBubbleProps {
  message: Message
}

function renderContent(content: string) {
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={lastIndex}>{content.slice(lastIndex, match.index)}</span>)
    }
    const language = match[1] || undefined
    const code = match[2].trim()
    parts.push(<CodeBlock key={match.index} code={code} language={language} />)
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    parts.push(<span key={lastIndex}>{content.slice(lastIndex)}</span>)
  }

  return parts.length > 0 ? parts : content
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isTool = message.role === 'tool'

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2',
          isUser
            ? 'bg-primary text-primary-foreground'
            : isTool
              ? 'bg-muted/50 text-muted-foreground border'
              : 'bg-muted text-muted-foreground',
        )}
      >
        {message.toolCall && <ToolCallCard toolCall={message.toolCall} />}
        <p className='whitespace-pre-wrap text-sm'>{renderContent(message.content)}</p>
      </div>
    </div>
  )
}
