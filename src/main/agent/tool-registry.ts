import type { ToolDefinition } from '@shared/ipc'

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map()

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool)
  }

  list(): ToolDefinition[] {
    return Array.from(this.tools.values())
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name)
  }

  has(name: string): boolean {
    return this.tools.has(name)
  }

  unregister(name: string): boolean {
    return this.tools.delete(name)
  }

  clear(): void {
    this.tools.clear()
  }
}

export function createToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry()

  // 注册 pi-mono 内置工具
  registry.register({
    name: 'read',
    description: '读取文件内容（支持文本、图片、行范围）',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '文件路径' },
        startLine: { type: 'number', description: '起始行号（可选）' },
        endLine: { type: 'number', description: '结束行号（可选）' }
      },
      required: ['path']
    }
  })

  registry.register({
    name: 'write',
    description: '创建或重写文件',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '文件路径' },
        content: { type: 'string', description: '文件内容' }
      },
      required: ['path', 'content']
    }
  })

  registry.register({
    name: 'edit',
    description: '精确修改文件（diff 模式）',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '文件路径' },
        oldString: { type: 'string', description: '要替换的原文' },
        newString: { type: 'string', description: '替换后的新文本' }
      },
      required: ['path', 'oldString', 'newString']
    }
  })

  registry.register({
    name: 'bash',
    description: '执行 Shell 命令',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Shell 命令' },
        timeout: { type: 'number', description: '超时时间（毫秒）', default: 30000 }
      },
      required: ['command']
    }
  })

  return registry
}
