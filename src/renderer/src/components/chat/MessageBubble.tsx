import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useState } from 'react'
import { ChevronDown, ChevronRight, Brain, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'
import { ToolCallCard } from './ToolCallCard'
import { CodeBlock } from './CodeBlock'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'

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
  thinkingContent?: string
  timestamp: number
}

interface MessageBubbleProps {
  message: Message
  onRewind?: (messageId: string) => void
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

function ThinkingBlock({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false)
  const { t } = useTranslation()

  return (
    <div className='mb-2 rounded-md border border-purple-500/20 bg-purple-500/5'>
      <button
        className='flex w-full items-center gap-1.5 px-3 py-1.5 text-xs text-purple-400 hover:bg-purple-500/10 transition-colors'
        onClick={() => setExpanded(!expanded)}
      >
        <Brain className='h-3.5 w-3.5' />
        <span className='font-medium'>{t('chat.thinkingProcess')}</span>
        {expanded ? (
          <ChevronDown className='ml-auto h-3.5 w-3.5' />
        ) : (
          <ChevronRight className='ml-auto h-3.5 w-3.5' />
        )}
      </button>
      {expanded && (
        <div className='border-t border-purple-500/20 px-3 py-2 text-xs text-purple-300/80 whitespace-pre-wrap'>
          {content}
        </div>
      )}
    </div>
  )
}

export function MessageBubble({ message, onRewind }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isTool = message.role === 'tool'
  const [rewindOpen, setRewindOpen] = useState(false)
  const { t } = useTranslation()

  return (
    <>
      <div className={cn('flex group', isUser ? 'justify-end' : 'justify-start')}>
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
          {message.thinkingContent && <ThinkingBlock content={message.thinkingContent} />}
          {isUser ? (
            <p className='whitespace-pre-wrap text-sm'>{message.content}</p>
          ) : (
            <div className='text-sm prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0'>
              <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {message.content}
              </Markdown>
            </div>
          )}
        </div>
        {isUser && onRewind && (
          <button
            className='ml-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted text-muted-foreground'
            onClick={() => setRewindOpen(true)}
            title={t('chat.rewindToHere')}
          >
            <RotateCcw className='h-3.5 w-3.5' />
          </button>
        )}
      </div>

      <AlertDialog open={rewindOpen} onOpenChange={setRewindOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('chat.rewindTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('chat.rewindConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => onRewind?.(message.id)}>
              {t('common.ok')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
