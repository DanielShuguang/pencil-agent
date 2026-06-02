import { ipcMain } from 'electron'
import { VectorStore } from './vector-store'

const vectorStore = new VectorStore()

export function registerMemoryHandlers(): void {
  ipcMain.handle('memory:store', async (_, { content, metadata }) => {
    try {
      return await vectorStore.store(content, metadata)
    } catch (error) {
      throw new Error(`Failed to store memory: ${error}`)
    }
  })

  ipcMain.handle('memory:recall', async (_, { query, topK }) => {
    try {
      return await vectorStore.recall(query, topK)
    } catch (error) {
      throw new Error(`Failed to recall memory: ${error}`)
    }
  })

  ipcMain.handle('memory:search', async (_, { query, filters }) => {
    try {
      return await vectorStore.search(query, filters)
    } catch (error) {
      throw new Error(`Failed to search memory: ${error}`)
    }
  })

  ipcMain.handle('memory:delete', async (_, id) => {
    try {
      return await vectorStore.delete(id)
    } catch (error) {
      throw new Error(`Failed to delete memory: ${error}`)
    }
  })

  ipcMain.handle('memory:clear-all', async () => {
    try {
      return await vectorStore.clearAll()
    } catch (error) {
      throw new Error(`Failed to clear memories: ${error}`)
    }
  })
}
