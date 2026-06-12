import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStore, getLanguageFromPath } from '../editor-store'

describe('editor-store', () => {
  beforeEach(() => {
    useEditorStore.setState({
      files: new Map(),
      openFiles: [],
      activeFilePath: null,
    })
  })

  describe('openFile', () => {
    it('should open a new file', () => {
      const { openFile } = useEditorStore.getState()
      openFile('/test/file.js', 'console.log("hello")', 'javascript')

      const state = useEditorStore.getState()
      expect(state.files.size).toBe(1)
      expect(state.openFiles).toContain('/test/file.js')
      expect(state.activeFilePath).toBe('/test/file.js')
    })

    it('should not duplicate file in openFiles', () => {
      const { openFile } = useEditorStore.getState()
      openFile('/test/file.js', 'content1', 'javascript')
      openFile('/test/file.js', 'content2', 'javascript')

      const state = useEditorStore.getState()
      expect(state.openFiles).toHaveLength(1)
    })
  })

  describe('closeFile', () => {
    it('should close a file', () => {
      const { openFile, closeFile } = useEditorStore.getState()
      openFile('/test/file1.js', 'content1', 'javascript')
      openFile('/test/file2.js', 'content2', 'javascript')
      closeFile('/test/file1.js')

      const state = useEditorStore.getState()
      expect(state.openFiles).not.toContain('/test/file1.js')
      expect(state.openFiles).toContain('/test/file2.js')
    })

    it('should update activeFilePath when closing active file', () => {
      const { openFile, closeFile } = useEditorStore.getState()
      openFile('/test/file1.js', 'content1', 'javascript')
      openFile('/test/file2.js', 'content2', 'javascript')
      closeFile('/test/file2.js')

      const state = useEditorStore.getState()
      expect(state.activeFilePath).toBe('/test/file1.js')
    })
  })

  describe('updateFileContent', () => {
    it('should update file content and mark as modified', () => {
      const { openFile, updateFileContent } = useEditorStore.getState()
      openFile('/test/file.js', 'original', 'javascript')
      updateFileContent('/test/file.js', 'modified')

      const state = useEditorStore.getState()
      const file = state.files.get('/test/file.js')
      expect(file?.content).toBe('modified')
      expect(file?.isModified).toBe(true)
      expect(file?.originalContent).toBe('original')
    })

    it('should preserve originalContent on multiple updates', () => {
      const { openFile, updateFileContent } = useEditorStore.getState()
      openFile('/test/file.js', 'v1', 'javascript')
      updateFileContent('/test/file.js', 'v2')
      updateFileContent('/test/file.js', 'v3')

      const state = useEditorStore.getState()
      const file = state.files.get('/test/file.js')
      expect(file?.content).toBe('v3')
      expect(file?.originalContent).toBe('v1')
      expect(file?.isModified).toBe(true)
    })
  })

  describe('setActiveFile', () => {
    it('should set active file', () => {
      const { openFile, setActiveFile } = useEditorStore.getState()
      openFile('/test/file1.js', 'content1', 'javascript')
      openFile('/test/file2.js', 'content2', 'javascript')
      setActiveFile('/test/file1.js')

      const state = useEditorStore.getState()
      expect(state.activeFilePath).toBe('/test/file1.js')
    })
  })
})

describe('getLanguageFromPath', () => {
  it('should return javascript for .js files', () => {
    expect(getLanguageFromPath('file.js')).toBe('javascript')
  })

  it('should return typescript for .ts files', () => {
    expect(getLanguageFromPath('file.ts')).toBe('typescript')
  })

  it('should return python for .py files', () => {
    expect(getLanguageFromPath('file.py')).toBe('python')
  })

  it('should return plaintext for unknown extensions', () => {
    expect(getLanguageFromPath('file.xyz')).toBe('plaintext')
  })
})
