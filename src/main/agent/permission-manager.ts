import { resolve, normalize, isAbsolute } from 'path'
import { homedir } from 'os'
import type { ToolPermissionConfig, ConfirmRequest } from '@shared/ipc'
import { checkDangerousCommand } from './dangerous-patterns'
import { appStore } from '../lib/store'

// 敏感路径黑名单（规范化后比较）
const SENSITIVE_PATHS = [
  resolve(homedir(), '.ssh'),
  resolve(homedir(), '.gnupg'),
  resolve(homedir(), '.aws'),
  resolve(homedir(), '.kube'),
  normalize('/etc'),
  normalize('/var'),
  normalize('/usr'),
  normalize('/root'),
]

// 低风险工具（smart 模式下自动放行）
const LOW_RISK_TOOLS = ['read', 'grep', 'find', 'ls']

export class PermissionManager {
  private config: ToolPermissionConfig
  // 会话级记住的选择: key = `${sessionId}:${toolName}`
  private sessionMemory = new Map<string, boolean>()

  constructor() {
    this.config = this.loadConfig()
  }

  private loadConfig(): ToolPermissionConfig {
    const stored = appStore.get('permission.config') as ToolPermissionConfig | undefined
    return stored || { mode: 'smart', disabledTools: [], dangerousPatternOverrides: [] }
  }

  private saveConfig(): void {
    appStore.set('permission.config', this.config)
  }

  getConfig(): ToolPermissionConfig {
    return { ...this.config }
  }

  updateConfig(update: Partial<ToolPermissionConfig>): void {
    this.config = { ...this.config, ...update }
    this.saveConfig()
  }

  // 检查工具是否被禁用
  isToolDisabled(toolName: string): boolean {
    return this.config.disabledTools.includes(toolName)
  }

  // 检查路径访问权限
  checkPathAccess(filePath: string, cwd: string): { allowed: boolean; reason?: string } {
    const normalizedPath = normalize(isAbsolute(filePath) ? filePath : resolve(cwd, filePath))

    // 检查敏感路径黑名单
    for (const sensitivePath of SENSITIVE_PATHS) {
      if (normalizedPath.startsWith(sensitivePath)) {
        return { allowed: false, reason: `禁止访问敏感路径: ${sensitivePath}` }
      }
    }

    return { allowed: true }
  }

  // 检查工具执行是否需要确认
  checkToolPermission(
    toolName: string,
    parameters: Record<string, unknown>,
    sessionId: string,
    cwd: string,
  ): { needsConfirm: boolean; request?: ConfirmRequest } {
    // 检查工具是否被禁用
    if (this.isToolDisabled(toolName)) {
      throw new Error(`工具 "${toolName}" 已被禁用`)
    }

    // 检查路径访问（read/write/edit 工具）
    if (['read', 'write', 'edit'].includes(toolName) && parameters.path) {
      const pathCheck = this.checkPathAccess(parameters.path as string, cwd)
      if (!pathCheck.allowed) {
        throw new Error(pathCheck.reason)
      }
    }

    // auto 模式直接放行
    if (this.config.mode === 'auto') {
      return { needsConfirm: false }
    }

    // smart 模式下低风险工具直接放行
    if (this.config.mode === 'smart' && LOW_RISK_TOOLS.includes(toolName)) {
      return { needsConfirm: false }
    }

    // 检查会话级记忆
    const memoryKey = `${sessionId}:${toolName}`
    if (this.sessionMemory.has(memoryKey)) {
      return { needsConfirm: false }
    }

    // 检查危险命令
    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    let pattern: string | undefined

    if (toolName === 'bash' && parameters.command) {
      const dangerousMatch = checkDangerousCommand(parameters.command as string)
      if (dangerousMatch) {
        riskLevel = 'high'
        pattern = dangerousMatch.description
      } else {
        riskLevel = 'medium'
      }
    } else if (['write', 'edit'].includes(toolName)) {
      riskLevel = 'medium'
    }

    // prompt 模式下所有工具都需要确认
    // smart 模式下高/中风险工具需要确认
    if (this.config.mode === 'prompt' || riskLevel !== 'low') {
      const request: ConfirmRequest = {
        id: `confirm-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        toolName,
        parameters,
        riskLevel,
        pattern,
      }
      return { needsConfirm: true, request }
    }

    return { needsConfirm: false }
  }

  // 记住会话级选择
  rememberSessionChoice(sessionId: string, toolName: string, allowed: boolean): void {
    const memoryKey = `${sessionId}:${toolName}`
    this.sessionMemory.set(memoryKey, allowed)
  }

  // 清除会话记忆
  clearSessionMemory(sessionId: string): void {
    for (const key of this.sessionMemory.keys()) {
      if (key.startsWith(`${sessionId}:`)) {
        this.sessionMemory.delete(key)
      }
    }
  }
}
