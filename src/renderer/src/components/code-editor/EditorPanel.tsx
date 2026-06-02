import { useRef, useEffect } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import { useEditorStore } from '../../stores/editor-store'

interface EditorPanelProps {
  className?: string
}

export function EditorPanel({ className }: EditorPanelProps) {
  const { files, activeFilePath, updateFileContent } = useEditorStore()
  const editorRef = useRef<any>(null)

  const activeFile = activeFilePath ? files.get(activeFilePath) : null

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor
  }

  const handleChange = (value: string | undefined) => {
    if (activeFilePath && value !== undefined) {
      updateFileContent(activeFilePath, value)
    }
  }

  useEffect(() => {
    if (editorRef.current && activeFile) {
      editorRef.current.setValue(activeFile.content)
    }
  }, [activeFilePath, activeFile?.content])

  if (!activeFile) {
    return (
      <div className={`flex items-center justify-center text-muted-foreground ${className}`}>
        <p className='text-sm'>打开文件开始编辑</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <Editor
        height='100%'
        language={activeFile.language}
        value={activeFile.content}
        onChange={handleChange}
        onMount={handleEditorMount}
        theme='vs-dark'
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
        }}
      />
    </div>
  )
}
