import { describe, it, expect, beforeEach } from 'vitest'
import { ToolRegistry, createToolRegistry } from '../tool-registry'

describe('ToolRegistry', () => {
  let registry: ToolRegistry

  beforeEach(() => {
    registry = new ToolRegistry()
  })

  it('should register a tool', () => {
    const tool = {
      name: 'test-tool',
      description: 'A test tool',
      parameters: { type: 'object', properties: {} },
    }
    registry.register(tool)
    expect(registry.get('test-tool')).toEqual(tool)
  })

  it('should list all registered tools', () => {
    registry.register({
      name: 'tool1',
      description: 'Tool 1',
      parameters: {},
    })
    registry.register({
      name: 'tool2',
      description: 'Tool 2',
      parameters: {},
    })
    const tools = registry.list()
    expect(tools).toHaveLength(2)
    expect(tools.map((t) => t.name)).toContain('tool1')
    expect(tools.map((t) => t.name)).toContain('tool2')
  })

  it('should check if tool exists', () => {
    registry.register({
      name: 'existing-tool',
      description: 'Exists',
      parameters: {},
    })
    expect(registry.has('existing-tool')).toBe(true)
    expect(registry.has('non-existing')).toBe(false)
  })

  it('should unregister a tool', () => {
    registry.register({
      name: 'to-remove',
      description: 'Will be removed',
      parameters: {},
    })
    expect(registry.has('to-remove')).toBe(true)
    registry.unregister('to-remove')
    expect(registry.has('to-remove')).toBe(false)
  })

  it('should clear all tools', () => {
    registry.register({ name: 'tool1', description: 'Tool 1', parameters: {} })
    registry.register({ name: 'tool2', description: 'Tool 2', parameters: {} })
    expect(registry.list()).toHaveLength(2)
    registry.clear()
    expect(registry.list()).toHaveLength(0)
  })
})

describe('createToolRegistry', () => {
  it('should create registry with built-in tools', () => {
    const registry = createToolRegistry()
    const tools = registry.list()
    expect(tools).toHaveLength(4)
    expect(tools.map((t) => t.name)).toContain('read')
    expect(tools.map((t) => t.name)).toContain('write')
    expect(tools.map((t) => t.name)).toContain('edit')
    expect(tools.map((t) => t.name)).toContain('bash')
  })

  it('should have valid JSON Schema for built-in tools', () => {
    const registry = createToolRegistry()
    const readTool = registry.get('read')
    expect(readTool).toBeDefined()
    expect(readTool!.parameters.type).toBe('object')
    expect(readTool!.parameters.properties).toBeDefined()
    expect(readTool!.parameters.required).toContain('path')
  })
})
