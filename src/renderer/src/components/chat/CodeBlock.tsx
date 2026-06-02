import { useEffect, useRef } from 'react'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

interface CodeBlockProps {
  code: string
  language?: string
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (codeRef.current) {
      if (language && hljs.getLanguage(language)) {
        codeRef.current.innerHTML = hljs.highlight(code, { language }).value
      } else {
        codeRef.current.innerHTML = hljs.highlightAuto(code).value
      }
    }
  }, [code, language])

  return (
    <pre className='rounded-md bg-[#0d1117] p-3 overflow-x-auto'>
      <code ref={codeRef} className='text-sm font-mono text-gray-300'>
        {code}
      </code>
    </pre>
  )
}
