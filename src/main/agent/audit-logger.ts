import { join } from 'path'
import { mkdirSync, appendFileSync, readFileSync, existsSync, unlinkSync, readdirSync } from 'fs'
import { app } from 'electron'
import type { AuditLogEntry } from '@shared/ipc'

// 日志保留天数
const LOG_RETENTION_DAYS = 30

export class AuditLogger {
  private logDir: string

  constructor() {
    this.logDir = join(app.getPath('userData'), 'audit-logs')
    this.ensureLogDir()
  }

  private ensureLogDir(): void {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true })
    }
  }

  private getLogFile(sessionId: string): string {
    return join(this.logDir, `${sessionId}.jsonl`)
  }

  // 记录工具调用
  log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
    const fullEntry: AuditLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
    }

    try {
      const logFile = this.getLogFile(entry.sessionId)
      appendFileSync(logFile, `${JSON.stringify(fullEntry)  }\n`, 'utf-8')
    } catch (error) {
      console.error('[AuditLogger] Failed to write log:', error)
    }
  }

  // 查询会话日志
  getLogs(sessionId: string): AuditLogEntry[] {
    const logFile = this.getLogFile(sessionId)
    if (!existsSync(logFile)) return []

    try {
      const content = readFileSync(logFile, 'utf-8')
      return content
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line) as AuditLogEntry)
    } catch {
      return []
    }
  }

  // 清理过期日志
  cleanup(): void {
    const cutoff = Date.now() - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000

    try {
      const files = readdirSync(this.logDir)
      for (const file of files) {
        if (!file.endsWith('.jsonl')) continue
        const filePath = join(this.logDir, file)
        const content = readFileSync(filePath, 'utf-8')
        const lines = content.split('\n').filter((l) => l.trim())

        // 检查最后一条记录的时间
        if (lines.length > 0) {
          const lastEntry = JSON.parse(lines[lines.length - 1]) as AuditLogEntry
          if (lastEntry.timestamp < cutoff) {
            unlinkSync(filePath)
          }
        }
      }
    } catch (error) {
      console.error('[AuditLogger] Cleanup failed:', error)
    }
  }

  // 清除所有日志
  clearAll(): void {
    try {
      const files = readdirSync(this.logDir)
      for (const file of files) {
        if (file.endsWith('.jsonl')) {
          unlinkSync(join(this.logDir, file))
        }
      }
    } catch (error) {
      console.error('[AuditLogger] Clear all failed:', error)
    }
  }
}
