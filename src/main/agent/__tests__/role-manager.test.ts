import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock electron app
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp/test-user-data'),
  },
}))

// Mock fs
vi.mock('fs', () => {
  const mockFs = {
    readFileSync: vi.fn(() => {
      throw new Error('File not found')
    }),
    writeFileSync: vi.fn(),
    existsSync: vi.fn(() => false),
    mkdirSync: vi.fn(),
  }
  return { ...mockFs, default: mockFs }
})

import { RoleManager } from '../role-manager'

describe('RoleManager', () => {
  let manager: RoleManager

  beforeEach(() => {
    vi.clearAllMocks()
    manager = new RoleManager()
  })

  it('should initialize with default roles', () => {
    const roles = manager.list()
    expect(roles.length).toBeGreaterThan(0)
    expect(roles.some((r) => r.id === 'researcher')).toBe(true)
    expect(roles.some((r) => r.id === 'analyst')).toBe(true)
    expect(roles.some((r) => r.id === 'writer')).toBe(true)
  })

  it('should get a role by id', () => {
    const role = manager.get('researcher')
    expect(role).toBeDefined()
    expect(role?.name).toBe('研究员')
  })

  it('should return undefined for non-existent role', () => {
    const role = manager.get('non-existent')
    expect(role).toBeUndefined()
  })

  it('should create a new role', () => {
    const newRole = manager.create({
      id: 'custom-role',
      name: 'Custom Role',
      description: 'A custom role',
      systemPrompt: 'You are a custom role',
      model: { id: 'gpt-4o', provider: 'openai' },
      tools: ['read', 'write'],
    })

    expect(newRole.id).toBe('custom-role')
    expect(newRole.createdAt).toBeDefined()
    expect(newRole.updatedAt).toBeDefined()

    const retrieved = manager.get('custom-role')
    expect(retrieved).toBeDefined()
    expect(retrieved?.name).toBe('Custom Role')
  })

  it('should update an existing role', () => {
    const updated = manager.update('researcher', {
      name: 'Updated Researcher',
      description: 'Updated description',
    })

    expect(updated).toBeDefined()
    expect(updated?.name).toBe('Updated Researcher')
    expect(updated?.description).toBe('Updated description')
    expect(updated?.updatedAt).toBeGreaterThanOrEqual(updated?.createdAt || 0)
  })

  it('should return undefined when updating non-existent role', () => {
    const updated = manager.update('non-existent', { name: 'Test' })
    expect(updated).toBeUndefined()
  })

  it('should delete a role', () => {
    const deleted = manager.delete('researcher')
    expect(deleted).toBe(true)
    expect(manager.get('researcher')).toBeUndefined()
  })

  it('should return false when deleting non-existent role', () => {
    const deleted = manager.delete('non-existent')
    expect(deleted).toBe(false)
  })

  it('should list all roles', () => {
    manager.create({
      id: 'test-role',
      name: 'Test Role',
      description: 'Test',
      systemPrompt: 'Test prompt',
      model: { id: 'gpt-4o', provider: 'openai' },
      tools: [],
    })

    const roles = manager.list()
    expect(roles.length).toBeGreaterThanOrEqual(4) // 3 default + 1 custom
  })
})
