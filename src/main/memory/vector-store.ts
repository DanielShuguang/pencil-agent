import { ChromaClient, type Collection } from 'chromadb'
import { app } from 'electron'
import { join } from 'path'

export interface MemoryEntry {
  id: string
  content: string
  metadata: {
    sessionId: string
    role: string
    timestamp: number
    tags: string[]
  }
  score?: number
}

export class VectorStore {
  private client: ChromaClient | null = null
  private collection: Collection | null = null
  private initialized = false
  private initPromise: Promise<void> | null = null

  constructor() {
    // Don't initialize in constructor - use lazy init
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return
    if (this.initPromise) return this.initPromise

    this.initPromise = this.init()
    return this.initPromise
  }

  private async init(): Promise<void> {
    try {
      const dbPath = join(app.getPath('userData'), 'chroma')
      const isWin = process.platform === 'win32'
      this.client = new ChromaClient({ path: isWin ? `file:///${dbPath}` : `file://${dbPath}` })
      this.collection = await this.client.getOrCreateCollection({
        name: 'agent_memory',
      })
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize ChromaDB:', error)
      throw error
    }
  }

  async store(content: string, metadata: MemoryEntry['metadata']): Promise<string> {
    await this.ensureInitialized()
    if (!this.collection) throw new Error('Vector store not initialized')

    const id = `mem-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    await this.collection.add({
      ids: [id],
      documents: [content],
      metadatas: [metadata as any],
    })
    return id
  }

  async recall(query: string, topK: number = 5): Promise<MemoryEntry[]> {
    await this.ensureInitialized()
    if (!this.collection) throw new Error('Vector store not initialized')

    const results = await this.collection.query({
      queryTexts: [query],
      nResults: topK,
    })

    const entries: MemoryEntry[] = []
    if (results.ids[0]) {
      for (let i = 0; i < results.ids[0].length; i++) {
        entries.push({
          id: results.ids[0][i],
          content: results.documents?.[0]?.[i] || '',
          metadata: (results.metadatas?.[0]?.[i] as any) || {},
          score: results.distances?.[0]?.[i] ?? undefined,
        })
      }
    }
    return entries
  }

  async search(
    query: string,
    filters?: { tags?: string[]; sessionId?: string },
  ): Promise<MemoryEntry[]> {
    await this.ensureInitialized()
    if (!this.collection) throw new Error('Vector store not initialized')

    const where: any = {}
    if (filters?.sessionId) {
      where.sessionId = filters.sessionId
    }

    const results = await this.collection.query({
      queryTexts: [query],
      nResults: 10,
      where: Object.keys(where).length > 0 ? where : undefined,
    })

    let entries: MemoryEntry[] = []
    if (results.ids[0]) {
      for (let i = 0; i < results.ids[0].length; i++) {
        entries.push({
          id: results.ids[0][i],
          content: results.documents?.[0]?.[i] || '',
          metadata: (results.metadatas?.[0]?.[i] as any) || {},
          score: results.distances?.[0]?.[i] ?? undefined,
        })
      }
    }

    // Filter by tags if specified
    if (filters?.tags && filters.tags.length > 0) {
      entries = entries.filter((entry) =>
        filters.tags!.some((tag) => entry.metadata.tags?.includes(tag)),
      )
    }

    return entries
  }

  async delete(id: string): Promise<void> {
    await this.ensureInitialized()
    if (!this.collection) throw new Error('Vector store not initialized')

    await this.collection.delete({ ids: [id] })
  }

  async clearAll(): Promise<void> {
    await this.ensureInitialized()
    if (!this.client || !this.collection) throw new Error('Vector store not initialized')

    // Delete the collection and recreate it
    await this.client.deleteCollection({ name: 'agent_memory' })
    this.collection = await this.client.getOrCreateCollection({
      name: 'agent_memory',
    })
  }
}
