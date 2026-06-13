import { create } from 'zustand'

interface FileNode {
  path: string
  name: string
  content: string
  language: string
  originalContent?: string
  isModified: boolean
}

interface EditorState {
  files: Map<string, FileNode>
  openFiles: string[]
  activeFilePath: string | null

  openFile: (path: string, content: string, language: string) => void
  closeFile: (path: string) => void
  setActiveFile: (path: string) => void
  updateFileContent: (path: string, newContent: string) => void
  acceptChanges: (path: string) => void
  rejectChanges: (path: string) => void
  getFile: (path: string) => FileNode | undefined
}

function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || ''
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    hpp: 'cpp',
    cs: 'csharp',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    fish: 'shell',
    ps1: 'powershell',
    json: 'json',
    xml: 'xml',
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    md: 'markdown',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    sql: 'sql',
    graphql: 'graphql',
    dockerfile: 'dockerfile',
    makefile: 'makefile',
  }
  return languageMap[ext] || 'plaintext'
}

export const useEditorStore = create<EditorState>((set, get) => ({
  files: new Map(),
  openFiles: [],
  activeFilePath: null,

  openFile: (path, content, language) => {
    set((state) => {
      const files = new Map(state.files)
      const existing = files.get(path)

      if (existing) {
        // 已存在：更新内容和语言，保留原始内容用于 diff
        files.set(path, {
          ...existing,
          content,
          language,  // 始终更新语言
          isModified: existing.originalContent !== undefined && existing.originalContent !== content,
        })
      } else {
        files.set(path, {
          path,
          name: path.split('/').pop() || path.split('\\').pop() || path,  // 兼容 Windows 路径
          content,
          language,
          isModified: false,
        })
      }

      const openFiles = state.openFiles.includes(path)
        ? state.openFiles
        : [...state.openFiles, path]

      return { files, openFiles, activeFilePath: path }
    })
  },

  closeFile: (path) => {
    set((state) => {
      const openFiles = state.openFiles.filter((f) => f !== path)
      const activeFilePath =
        state.activeFilePath === path
          ? openFiles[openFiles.length - 1] || null
          : state.activeFilePath

      return { openFiles, activeFilePath }
    })
  },

  setActiveFile: (path) => {
    set({ activeFilePath: path })
  },

  updateFileContent: (path, newContent) => {
    set((state) => {
      const files = new Map(state.files)
      const file = files.get(path)
      if (file) {
        files.set(path, {
          ...file,
          originalContent: file.originalContent ?? file.content,
          content: newContent,
          isModified: true,
        })
      }
      return { files }
    })
  },

  acceptChanges: (path) => {
    set((state) => {
      const files = new Map(state.files)
      const file = files.get(path)
      if (file) {
        files.set(path, {
          ...file,
          originalContent: undefined,
          isModified: false,
        })
      }
      return { files }
    })
  },

  rejectChanges: (path) => {
    set((state) => {
      const files = new Map(state.files)
      const file = files.get(path)
      if (file && file.originalContent !== undefined) {
        files.set(path, {
          ...file,
          content: file.originalContent,
          originalContent: undefined,
          isModified: false,
        })
      }
      return { files }
    })
  },

  getFile: (path) => {
    return get().files.get(path)
  },
}))

export { getLanguageFromPath }
export type { FileNode }
