import { create } from 'zustand'

interface FileNode {
  path: string
  name: string
  content: string
  language: string
  isDirty: boolean
}

interface EditorState {
  files: Map<string, FileNode>
  openFiles: string[]
  activeFilePath: string | null

  openFile: (path: string, content: string, language: string) => void
  closeFile: (path: string) => void
  setActiveFile: (path: string) => void
  updateFileContent: (path: string, content: string) => void
  markDirty: (path: string, isDirty: boolean) => void
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

      if (!files.has(path)) {
        files.set(path, {
          path,
          name: path.split('/').pop() || path,
          content,
          language,
          isDirty: false,
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

  updateFileContent: (path, content) => {
    set((state) => {
      const files = new Map(state.files)
      const file = files.get(path)
      if (file) {
        files.set(path, { ...file, content, isDirty: true })
      }
      return { files }
    })
  },

  markDirty: (path, isDirty) => {
    set((state) => {
      const files = new Map(state.files)
      const file = files.get(path)
      if (file) {
        files.set(path, { ...file, isDirty })
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
