import { describe, it, expect, beforeEach } from 'vitest'
import { useSandboxStore } from '../sandbox-store'

describe('sandbox-store', () => {
  beforeEach(() => {
    useSandboxStore.setState({
      executions: new Map(),
      activeExecutionId: null,
    })
  })

  describe('startExecution', () => {
    it('should create a new execution', () => {
      const { startExecution } = useSandboxStore.getState()
      startExecution('exec-1', 'javascript', 'console.log("hello")')

      const state = useSandboxStore.getState()
      expect(state.executions.size).toBe(1)
      expect(state.activeExecutionId).toBe('exec-1')

      const execution = state.executions.get('exec-1')
      expect(execution?.language).toBe('javascript')
      expect(execution?.status).toBe('running')
    })
  })

  describe('appendOutput', () => {
    it('should append output to active execution', () => {
      const { startExecution, appendOutput } = useSandboxStore.getState()
      startExecution('exec-1', 'javascript', 'console.log("hello")')
      appendOutput({ type: 'stdout', content: 'hello\n' })

      const state = useSandboxStore.getState()
      const execution = state.executions.get('exec-1')
      expect(execution?.output).toHaveLength(1)
      expect(execution?.output[0].content).toBe('hello\n')
    })

    it('should update execution status on exit', () => {
      const { startExecution, appendOutput } = useSandboxStore.getState()
      startExecution('exec-1', 'javascript', 'console.log("hello")')
      appendOutput({ type: 'exit', content: '', exitCode: 0 })

      const state = useSandboxStore.getState()
      const execution = state.executions.get('exec-1')
      expect(execution?.status).toBe('completed')
      expect(execution?.exitCode).toBe(0)
    })

    it('should mark error status for non-zero exit code', () => {
      const { startExecution, appendOutput } = useSandboxStore.getState()
      startExecution('exec-1', 'javascript', 'process.exit(1)')
      appendOutput({ type: 'exit', content: '', exitCode: 1 })

      const state = useSandboxStore.getState()
      const execution = state.executions.get('exec-1')
      expect(execution?.status).toBe('error')
      expect(execution?.exitCode).toBe(1)
    })
  })

  describe('completeExecution', () => {
    it('should complete execution with success', () => {
      const { startExecution, completeExecution } = useSandboxStore.getState()
      startExecution('exec-1', 'javascript', 'console.log("hello")')
      completeExecution(0)

      const state = useSandboxStore.getState()
      const execution = state.executions.get('exec-1')
      expect(execution?.status).toBe('completed')
      expect(execution?.exitCode).toBe(0)
    })
  })

  describe('clearExecution', () => {
    it('should clear an execution', () => {
      const { startExecution, clearExecution } = useSandboxStore.getState()
      startExecution('exec-1', 'javascript', 'console.log("hello")')
      clearExecution('exec-1')

      const state = useSandboxStore.getState()
      expect(state.executions.size).toBe(0)
      expect(state.activeExecutionId).toBeNull()
    })
  })

  describe('clearAll', () => {
    it('should clear all executions', () => {
      const { startExecution, clearAll } = useSandboxStore.getState()
      startExecution('exec-1', 'javascript', 'code1')
      startExecution('exec-2', 'python', 'code2')
      clearAll()

      const state = useSandboxStore.getState()
      expect(state.executions.size).toBe(0)
      expect(state.activeExecutionId).toBeNull()
    })
  })
})
