import { randomUUID } from 'crypto'
import type { SandboxExecuteRequest, SandboxOutput, SandboxResult } from '@shared/ipc'
import type { SandboxExecutor } from './executor'
import { createLocalBashOperations } from '@earendil-works/pi-coding-agent'

function getDefaultShell(): string | undefined {
  // Windows 优先使用 PowerShell，避免 WSL bash 问题
  if (process.platform === 'win32') {
    return 'powershell.exe'
  }
  return undefined
}

export class ChildProcessSandbox implements SandboxExecutor {
  private bashOps = createLocalBashOperations({ shellPath: getDefaultShell() })
  private abortControllers = new Map<string, AbortController>()

  async execute(
    req: SandboxExecuteRequest,
    onOutput?: (output: SandboxOutput) => void,
  ): Promise<SandboxResult> {
    const executionId = randomUUID()
    const timeout = req.timeout || 30000
    const abortController = new AbortController()
    this.abortControllers.set(executionId, abortController)

    let stdout = ''
    let stderr = ''

    try {
      const command = this.buildCommand(req)
      const cwd = req.cwd || process.cwd()
      const { exitCode } = await this.bashOps.exec(command, cwd, {
        onData: (data: Buffer) => {
          const content = data.toString()
          stdout += content
          onOutput?.({ type: 'stdout', content })
        },
        signal: abortController.signal,
        timeout: timeout / 1000, // pi使用秒为单位
        env: req.env ? { ...process.env, ...req.env } : undefined,
      })

      onOutput?.({ type: 'exit', content: '', exitCode: exitCode ?? 1 })
      return { stdout, stderr, exitCode: exitCode ?? 1, executionId }
    } catch (err: any) {
      const message = err.message || 'Execution failed'
      stderr += message
      onOutput?.({ type: 'stderr', content: message })
      onOutput?.({ type: 'exit', content: '', exitCode: 1 })
      return { stdout, stderr, exitCode: 1, executionId }
    } finally {
      this.abortControllers.delete(executionId)
    }
  }

  stop(executionId: string): void {
    const controller = this.abortControllers.get(executionId)
    if (controller) {
      controller.abort()
      this.abortControllers.delete(executionId)
    }
  }

  private buildCommand(req: SandboxExecuteRequest): string {
    switch (req.language) {
      case 'javascript':
        return `node -e ${JSON.stringify(req.code)}`
      case 'typescript':
        return `npx tsx -e ${JSON.stringify(req.code)}`
      case 'python':
        return `python -c ${JSON.stringify(req.code)}`
      case 'bash':
        // Windows cmd 不支持 bash 语法，直接返回命令
        return req.code
      default:
        throw new Error(`Unsupported language: ${req.language}`)
    }
  }
}
