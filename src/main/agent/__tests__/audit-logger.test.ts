import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { existsSync, readFileSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'
import { AuditLogger } from '../audit-logger'

const { mockGetPath } = vi.hoisted(() => ({
  mockGetPath: vi.fn(),
}))

vi.mock('electron', () => ({
  app: { getPath: mockGetPath },
}))

describe('AuditLogger', () => {
  let logger: AuditLogger
  let testDir: string
  let logsDir: string

  beforeEach(() => {
    vi.clearAllMocks()
    testDir = join(tmpdir(), `audit-test-${randomUUID()}`)
    logsDir = join(testDir, 'audit-logs')
    mkdirSync(testDir, { recursive: true })
    mockGetPath.mockReturnValue(testDir)
    logger = new AuditLogger()
  })

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true })
    } catch {}
  })

  describe('log', () => {
    it('should write log entry to file', () => {
      logger.log({
        sessionId: 'session-1',
        toolName: 'bash',
        parameters: { command: 'ls' },
        status: 'success',
        duration: 100,
      })

      const logFile = join(logsDir, 'session-1.jsonl')
      expect(existsSync(logFile)).toBe(true)

      const content = readFileSync(logFile, 'utf-8')
      const entries = content.split('\n').filter((l) => l.trim())
      expect(entries.length).toBe(1)

      const entry = JSON.parse(entries[0])
      expect(entry.toolName).toBe('bash')
      expect(entry.status).toBe('success')
      expect(entry.sessionId).toBe('session-1')
    })
  })

  describe('getLogs', () => {
    it('should return empty array when file does not exist', () => {
      expect(logger.getLogs('non-existent')).toEqual([])
    })

    it('should parse JSONL entries', () => {
      logger.log({
        sessionId: 's1',
        toolName: 'bash',
        parameters: { command: 'ls' },
        status: 'success',
        duration: 10,
      })
      logger.log({
        sessionId: 's1',
        toolName: 'read',
        parameters: { path: '/tmp' },
        status: 'error',
        error: 'fail',
        duration: 5,
      })

      const logs = logger.getLogs('s1')
      expect(logs.length).toBe(2)
      expect(logs[0].toolName).toBe('bash')
      expect(logs[1].toolName).toBe('read')
      expect(logs[1].error).toBe('fail')
    })
  })

  describe('clearAll', () => {
    it('should delete all log files', () => {
      logger.log({
        sessionId: 's1',
        toolName: 'bash',
        parameters: {},
        status: 'success',
        duration: 0,
      })
      logger.log({
        sessionId: 's2',
        toolName: 'read',
        parameters: {},
        status: 'success',
        duration: 0,
      })

      logger.clearAll()

      expect(existsSync(join(logsDir, 's1.jsonl'))).toBe(false)
      expect(existsSync(join(logsDir, 's2.jsonl'))).toBe(false)
    })
  })

  describe('cleanup', () => {
    const THIRTY_ONE_DAYS_MS = 31 * 24 * 60 * 60 * 1000

    function writeLogFile(sessionId: string, timestamps: number[]): string {
      const filePath = join(logsDir, `${sessionId}.jsonl`)
      const content = timestamps
        .map((timestamp, index) =>
          JSON.stringify({
            id: `log-${index}`,
            timestamp,
            sessionId,
            toolName: 'bash',
            parameters: {},
            status: 'success',
            duration: 1,
          }),
        )
        .join('\n')
      writeFileSync(filePath, `${content}\n`, 'utf-8')
      return filePath
    }

    it('删除最后一条记录超过 30 天的日志文件', () => {
      const staleFile = writeLogFile('stale', [Date.now() - THIRTY_ONE_DAYS_MS])

      logger.cleanup()

      expect(existsSync(staleFile)).toBe(false)
    })

    it('保留仍有近期记录的日志文件', () => {
      const freshFile = writeLogFile('fresh', [
        Date.now() - THIRTY_ONE_DAYS_MS,
        Date.now() - 1000,
      ])

      logger.cleanup()

      expect(existsSync(freshFile)).toBe(true)
      expect(logger.getLogs('fresh')).toHaveLength(2)
    })

    it('保留内容为空的日志文件', () => {
      const emptyFile = join(logsDir, 'empty.jsonl')
      writeFileSync(emptyFile, '', 'utf-8')

      logger.cleanup()

      expect(existsSync(emptyFile)).toBe(true)
    })

    it('忽略非 jsonl 文件', () => {
      const otherFile = join(logsDir, 'notes.txt')
      writeFileSync(otherFile, 'keep me', 'utf-8')

      logger.cleanup()

      expect(existsSync(otherFile)).toBe(true)
    })

    it('损坏的 JSONL 不会抛出（当前实现会中断后续文件清理）', () => {
      const brokenFile = join(logsDir, 'broken.jsonl')
      writeFileSync(brokenFile, 'not-json\n', 'utf-8')
      const staleFile = writeLogFile('stale', [Date.now() - THIRTY_ONE_DAYS_MS])

      expect(() => logger.cleanup()).not.toThrow()
      expect(existsSync(brokenFile)).toBe(true)
      // 当前实现里 JSON.parse 失败会被外层 catch 吞掉，后续文件不再清理。
      // 这里锁定现状；若将来改为逐文件容错，应把断言改为 expect(existsSync(staleFile)).toBe(false)。
      expect(existsSync(staleFile)).toBe(true)
    })
  })
})
