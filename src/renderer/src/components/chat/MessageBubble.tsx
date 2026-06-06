import Markdown from 'react-markdown'
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

const markdownComponents = {
  code({ node: _node, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '')
    const isInline = !match && !String(children).includes('\n')

    if (isInline) {
      return (
        <code className='bg-muted/80 px-1.5 py-0.5 rounded text-sm font-mono' {...props}>
          {children}
        </code>
      )
    }

    return <CodeBlock code={String(children).replace(/\n$/, '')} language={match?.[1]} />
  },
  pre({ children }: any) {
    return <>{children}</>
  },
  p({ children }: any) {
    return <p className='mb-2 last:mb-0'>{children}</p>
  },
  ul({ children }: any) {
    return <ul className='list-disc pl-6 mb-2 space-y-1'>{children}</ul>
  },
  ol({ children }: any) {
    return <ol className='list-decimal pl-6 mb-2 space-y-1'>{children}</ol>
  },
  li({ children }: any) {
    return <li className='text-sm'>{children}</li>
  },
  h1({ children }: any) {
    return <h1 className='text-xl font-bold mb-2'>{children}</h1>
  },
  h2({ children }: any) {
    return <h2 className='text-lg font-bold mb-2'>{children}</h2>
  },
  h3({ children }: any) {
    return <h3 className='text-base font-bold mb-1'>{children}</h3>
  },
  blockquote({ children }: any) {
    return (
      <blockquote className='border-l-4 border-muted-foreground/30 pl-3 italic my-2'>
        {children}
      </blockquote>
    )
  },
  a({ href, children }: any) {
    return (
      <a
        href={href}
        target='_blank'
        rel='noopener noreferrer'
        className='text-blue-400 hover:underline'
      >
        {children}
      </a>
    )
  },
  table({ children }: any) {
    return (
      <div className='overflow-x-auto my-2'>
        <table className='border-collapse text-sm'>{children}</table>
      </div>
    )
  },
  th({ children }: any) {
    return <th className='border border-muted-foreground/30 px-2 py-1 bg-muted/50 font-medium'>{children}</th>
  },
  td({ children }: any) {
    return <td className='border border-muted-foreground/30 px-2 py-1'>{children}</td>
  },
  hr() {
    return <hr className='border-muted-foreground/30 my-2' />
  },
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
        {isUser ? (
          <p className='whitespace-pre-wrap text-sm'>{message.content}</p>
        ) : (
          <div className='text-sm prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0'>
            <Markdown components={markdownComponents}>{message.content}</Markdown>
          </div>
        )}
      </div>
    </div>
  )
}
