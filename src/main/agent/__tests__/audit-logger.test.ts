import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { existsSync, readFileSync, mkdirSync, rmSync } from 'fs'
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
})
