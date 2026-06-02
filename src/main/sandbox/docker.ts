import Docker from 'dockerode'
import { randomUUID } from 'crypto'
import type { SandboxExecuteRequest, SandboxOutput, SandboxResult } from '@shared/ipc'
import type { SandboxExecutor } from './executor'

interface RunningContainer {
  containerId: string
  stdout: string
  stderr: string
}

export class DockerSandbox implements SandboxExecutor {
  private docker: Docker
  private running: Map<string, RunningContainer> = new Map()

  constructor() {
    this.docker = new Docker()
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.docker.ping()
      return true
    } catch {
      return false
    }
  }

  async execute(
    req: SandboxExecuteRequest,
    onOutput?: (output: SandboxOutput) => void,
  ): Promise<SandboxResult> {
    const executionId = randomUUID()
    const timeout = req.timeout || 30000

    const image = this.getImage(req.language)
    const command = this.buildCommand(req)

    const container = await this.docker.createContainer({
      Image: image,
      Cmd: command,
      HostConfig: {
        Memory: 256 * 1024 * 1024, // 256MB
        CpuQuota: 50000, // 50% CPU
        NetworkMode: 'none', // 禁用网络
        AutoRemove: true,
        ReadonlyRootfs: true,
      },
      Env: Object.entries(req.env || {}).map(([k, v]) => `${k}=${v}`),
      StopTimeout: Math.floor(timeout / 1000),
    })

    await container.start()
    this.running.set(executionId, { containerId: container.id, stdout: '', stderr: '' })

    return new Promise((resolve) => {
      let stdout = ''
      let stderr = ''

      container.attach({ stream: true, stdout: true, stderr: true }, (err, stream) => {
        if (err || !stream) {
          this.running.delete(executionId)
          resolve({ stdout: '', stderr: err?.message || 'Failed to attach', exitCode: 1, executionId })
          return
        }

        stream.on('data', (chunk: Buffer) => {
          const data = chunk.toString()
          // Docker 多路复用流: 第一个字节表示 stdout(1) 或 stderr(2)
          if (data.length > 0 && data.charCodeAt(0) === 1) {
            const content = data.slice(8) // 跳过 8 字节头部
            stdout += content
            onOutput?.({ type: 'stdout', content })
          } else if (data.length > 0 && data.charCodeAt(0) === 2) {
            const content = data.slice(8)
            stderr += content
            onOutput?.({ type: 'stderr', content })
          } else {
            stdout += data
            onOutput?.({ type: 'stdout', content: data })
          }
        })

        container.wait((_waitErr, result) => {
          this.running.delete(executionId)
          const exitCode = result?.StatusCode ?? 1
          onOutput?.({ type: 'exit', content: '', exitCode })
          resolve({ stdout, stderr, exitCode, executionId })
        })
      })

      // 超时处理
      setTimeout(() => {
        if (this.running.has(executionId)) {
          container.kill().catch(() => {})
          this.running.delete(executionId)
          stderr += '\n[Timeout] Execution timed out'
          onOutput?.({ type: 'stderr', content: '\n[Timeout] Execution timed out' })
          onOutput?.({ type: 'exit', content: '', exitCode: 124 })
          resolve({ stdout, stderr, exitCode: 124, executionId })
        }
      }, timeout)
    })
  }

  stop(executionId: string): void {
    const running = this.running.get(executionId)
    if (running) {
      this.docker.getContainer(running.containerId).kill().catch(() => {})
      this.running.delete(executionId)
    }
  }

  private getImage(language: string): string {
    const imageMap: Record<string, string> = {
      javascript: 'node:22-slim',
      typescript: 'node:22-slim',
      python: 'python:3.12-slim',
      bash: 'ubuntu:24.04',
    }
    return imageMap[language] || 'node:22-slim'
  }

  private buildCommand(req: SandboxExecuteRequest): string[] {
    switch (req.language) {
      case 'javascript':
        return ['node', '-e', req.code]
      case 'typescript':
        return ['npx', 'tsx', '-e', req.code]
      case 'python':
        return ['python3', '-c', req.code]
      case 'bash':
        return ['bash', '-c', req.code]
      default:
        throw new Error(`Unsupported language: ${req.language}`)
    }
  }
}
