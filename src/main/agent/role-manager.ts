import { app } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'

export interface AgentRole {
  id: string
  name: string
  description: string
  systemPrompt: string
  model: { id: string; provider: string }
  tools: string[]
  createdAt: number
  updatedAt: number
}

function createDefaultRoles(): AgentRole[] {
  const now = Date.now()
  return [
    {
      id: 'researcher',
      name: '研究员',
      description: '负责搜索和收集信息',
      systemPrompt:
        '你是一个专业的研究员，负责搜索和收集相关信息。请仔细分析问题，提供准确、全面的信息。',
      model: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
      tools: ['read', 'write', 'bash'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'analyst',
      name: '分析师',
      description: '负责分析和处理数据',
      systemPrompt:
        '你是一个专业的数据分析师，负责分析和处理数据。请使用严谨的分析方法，提供有洞察力的结论。',
      model: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
      tools: ['read', 'write', 'bash'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'writer',
      name: '写作者',
      description: '负责撰写和整理文档',
      systemPrompt:
        '你是一个专业的写作者，负责撰写和整理文档。请使用清晰、专业的语言，确保文档质量。',
      model: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
      tools: ['read', 'write'],
      createdAt: now,
      updatedAt: now,
    },
  ]
}

export class RoleManager {
  private roles: Map<string, AgentRole> = new Map()
  private dataPath: string
  private dataDir: string

  constructor() {
    this.dataPath = join(app.getPath('userData'), 'roles.json')
    this.dataDir = dirname(this.dataPath)
    this.load()
  }

  private load(): void {
    try {
      if (existsSync(this.dataPath)) {
        const data = readFileSync(this.dataPath, 'utf-8')
        const roles = JSON.parse(data) as AgentRole[]
        for (const role of roles) {
          this.roles.set(role.id, role)
        }
      } else {
        // Initialize with default roles
        for (const role of createDefaultRoles()) {
          this.roles.set(role.id, role)
        }
        this.save()
      }
    } catch (error) {
      console.error('Failed to load roles:', error)
      // Initialize with default roles on error
      for (const role of createDefaultRoles()) {
        this.roles.set(role.id, role)
      }
    }
  }

  private save(): void {
    try {
      if (!existsSync(this.dataDir)) {
        mkdirSync(this.dataDir, { recursive: true })
      }
      const data = JSON.stringify(Array.from(this.roles.values()), null, 2)
      writeFileSync(this.dataPath, data, 'utf-8')
    } catch (error) {
      console.error('Failed to save roles:', error)
    }
  }

  list(): AgentRole[] {
    return Array.from(this.roles.values())
  }

  get(id: string): AgentRole | undefined {
    return this.roles.get(id)
  }

  create(role: Omit<AgentRole, 'createdAt' | 'updatedAt'>): AgentRole {
    const now = Date.now()
    const newRole: AgentRole = {
      ...role,
      createdAt: now,
      updatedAt: now,
    }
    this.roles.set(newRole.id, newRole)
    this.save()
    return newRole
  }

  update(id: string, updates: Partial<AgentRole>): AgentRole | undefined {
    const existing = this.roles.get(id)
    if (!existing) return undefined

    const updated: AgentRole = {
      ...existing,
      ...updates,
      id, // Prevent ID change
      updatedAt: Date.now(),
    }
    this.roles.set(id, updated)
    this.save()
    return updated
  }

  delete(id: string): boolean {
    const deleted = this.roles.delete(id)
    if (deleted) {
      this.save()
    }
    return deleted
  }
}
