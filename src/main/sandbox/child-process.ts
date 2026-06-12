import { spawn, type ChildProcess } from 'child_process'
import { randomUUID } from 'crypto'
import type { SandboxExecuteRequest, SandboxOutput, SandboxResult } from '@shared/ipc'
import type { SandboxExecutor } from './executor'

interface RunningProcess {
  process: ChildProcess
  stdout: string
  stderr: string
}

export class ChildProcessSandbox implements SandboxExecutor {
  private running: Map<string, RunningProcess> = new Map()

  async execute(
    req: SandboxExecuteRequest,
    onOutput?: (output: SandboxOutput) => void,
  ): Promise<SandboxResult> {
    const executionId = randomUUID()
    const timeout = req.timeout || 30000

    return new Promise((resolve) => {
      const { command, args } = this.buildCommand(req)
      const child = spawn(command, args, {
        shell: true,
        timeout,
        cwd: req.cwd,
        env: { ...process.env, ...req.env },
      })

      let stdout = ''
      let stderr = ''

      this.running.set(executionId, { process: child, stdout: '', stderr: '' })

      child.stdout?.on('data', (data: Buffer) => {
        const content = data.toString()
        stdout += content
        onOutput?.({ type: 'stdout', content })
      })

      child.stderr?.on('data', (data: Buffer) => {
        const content = data.toString()
        stderr += content
        onOutput?.({ type: 'stderr', content })
      })

      child.on('close', (code) => {
        this.running.delete(executionId)
        onOutput?.({ type: 'exit', content: '', exitCode: code ?? 1 })
        resolve({ stdout, stderr, exitCode: code ?? 1, executionId })
      })

      child.on('error', (err) => {
        this.running.delete(executionId)
        stderr += err.message
        onOutput?.({ type: 'stderr', content: err.message })
        resolve({ stdout, stderr, exitCode: 1, executionId })
      })
    })
  }

  stop(executionId: string): void {
    const running = this.running.get(executionId)
    if (running) {
      running.process.kill('SIGTERM')
      this.running.delete(executionId)
    }
  }

  private buildCommand(req: SandboxExecuteRequest): { command: string; args: string[] } {
    switch (req.language) {
      case 'javascript':
        return { command: 'node', args: ['-e', req.code] }
      case 'typescript':
        return { command: 'npx', args: ['tsx', '-e', req.code] }
      case 'python':
        return { command: 'python', args: ['-c', req.code] }
      case 'bash':
        return { command: 'bash', args: ['-c', req.code] }
      default:
        throw new Error(`Unsupported language: ${req.language}`)
    }
  }
}
