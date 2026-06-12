import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Editor, { DiffEditor, type OnMount } from '@monaco-editor/react'
import { useEditorStore } from '../../stores/editor-store'

interface EditorPanelProps {
  className?: string
}

export function EditorPanel({ className }: EditorPanelProps) {
  const { files, activeFilePath } = useEditorStore()
  const editorRef = useRef<any>(null)
  const { t } = useTranslation()

  const activeFile = activeFilePath ? files.get(activeFilePath) : null

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor
  }

  if (!activeFile) {
    return (
      <div className={`flex items-center justify-center text-muted-foreground ${className}`}>
        <p className='text-sm'>{t('editor.openFileToEdit')}</p>
      </div>
    )
  }

  const showDiff = activeFile.isModified && activeFile.originalContent !== undefined

  return (
    <div className={className}>
      {showDiff ? (
        <DiffEditor
          height='100%'
          language={activeFile.language}
          original={activeFile.originalContent!}
          modified={activeFile.content}
          theme='vs-dark'
          options={{
            readOnly: true,
            renderSideBySide: true,
            minimap: { enabled: false },
            fontSize: 14,
            automaticLayout: true,
          }}
        />
      ) : (
        <Editor
          height='100%'
          language={activeFile.language}
          value={activeFile.content}
          theme='vs-dark'
          onMount={handleEditorMount}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            domReadOnly: true,
          }}
        />
      )}
    </div>
  )
}
