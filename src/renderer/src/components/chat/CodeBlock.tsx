import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import hljs from 'highlight.js'
import { Copy, Check } from 'lucide-react'
import 'highlight.js/styles/github-dark.css'

interface CodeBlockProps {
  code: string
  language?: string
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    if (codeRef.current) {
      if (language && hljs.getLanguage(language)) {
        codeRef.current.innerHTML = hljs.highlight(code, { language }).value
      } else {
        codeRef.current.innerHTML = hljs.highlightAuto(code).value
      }
    }
  }, [code, language])

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  return (
    <div className='relative group'>
      <pre className='rounded-md bg-[#0d1117] p-3 overflow-x-auto'>
        <code ref={codeRef} className='text-sm font-mono text-gray-300'>
          {code}
        </code>
      </pre>
      <button
        onClick={handleCopy}
        className='absolute top-2 right-2 p-1.5 rounded-md bg-muted/80 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-foreground transition-all'
        title={t('chat.copyCode')}
      >
        {copied ? <Check className='h-3.5 w-3.5 text-green-500' /> : <Copy className='h-3.5 w-3.5' />}
      </button>
    </div>
  )
}
